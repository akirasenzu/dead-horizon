using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DeadHorizon;

sealed record VerifiedUpdate(Version Version, string Sha256, long Size, string Path);
sealed record UpdateResult(string Message, VerifiedUpdate? Update = null, bool Retry = false);

// Versioned installations avoid overwriting a running executable. The file the
// player originally downloaded remains a stable entry point into this cache.
sealed class UpdateManager
{
    internal const string Feed = "https://github.com/akirasenzu/dead-horizon/releases/latest/download/update.json";
    const string ReleaseRoot = "https://github.com/akirasenzu/dead-horizon/releases/download/";
    const long MaximumSize = 200 * 1024 * 1024;
    readonly string root;
    readonly Version current;
    readonly HttpClient http;
    string StatePath => System.IO.Path.Combine(root, "Updates", "active.json");
    internal UpdateManager(string root, Version current, HttpClient http) { this.root = System.IO.Path.GetFullPath(root); this.current = current; this.http = http; }

    internal static HttpClient CreateClient()
    {
        var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = true, MaxAutomaticRedirections = 6 });
        client.Timeout = Timeout.InfiniteTimeSpan;
        client.DefaultRequestHeaders.UserAgent.ParseAdd("DeadHorizon-Launcher/2.2");
        return client;
    }
    string VersionPath(Version version) => System.IO.Path.Combine(root, "Versions", version.ToString(3), "DeadHorizon.exe");
    static bool ValidHash(string? hash) => hash != null && Regex.IsMatch(hash, "\\A[0-9a-fA-F]{64}\\z");
    static bool ValidVersion(string? text, out Version version)
    {
        version = new Version(0, 0, 0);
        return text != null && Regex.IsMatch(text, "\\A[0-9]{1,5}\\.[0-9]{1,5}\\.[0-9]{1,8}\\z") && Version.TryParse(text, out version!);
    }
    static bool Matches(string path, string hash, long size)
    {
        if (!ValidHash(hash) || size < 1024 || size > MaximumSize || !File.Exists(path) || new FileInfo(path).Length != size) return false;
        using var file = File.OpenRead(path);
        return CryptographicOperations.FixedTimeEquals(SHA256.HashData(file), Convert.FromHexString(hash));
    }
    internal VerifiedUpdate? CachedUpdate()
    {
        try
        {
            if (!File.Exists(StatePath) || new FileInfo(StatePath).Length > 8192) return null;
            using var doc = JsonDocument.Parse(File.ReadAllText(StatePath)); var j = doc.RootElement;
            if (j.GetProperty("schema").GetInt32() != 1 || !ValidVersion(j.GetProperty("version").GetString(), out var version) || version <= current) return null;
            string hash = j.GetProperty("sha256").GetString() ?? ""; long size = j.GetProperty("size").GetInt64(); string path = VersionPath(version);
            return Matches(path, hash, size) ? new(version, hash, size, path) : null;
        }
        catch { return null; }
    }
    internal void Activate(VerifiedUpdate update)
    {
        // State contains no executable path supplied by the network or by disk.
        if (update.Version <= current || !string.Equals(System.IO.Path.GetFullPath(update.Path), VersionPath(update.Version), StringComparison.OrdinalIgnoreCase) || !Matches(update.Path, update.Sha256, update.Size)) throw new InvalidDataException("La mise à jour n’a pas pu être vérifiée.");
        Directory.CreateDirectory(System.IO.Path.GetDirectoryName(StatePath)!);
        string temporary = StatePath + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try { File.WriteAllText(temporary, JsonSerializer.Serialize(new { schema = 1, version = update.Version.ToString(3), sha256 = update.Sha256, size = update.Size })); File.Move(temporary, StatePath, true); }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }
    internal async Task<UpdateResult> PrepareAsync(IProgress<(string Text, int Percent)>? progress, CancellationToken cancellation = default)
    {
        string? temporary = null;
        try
        {
            string updates = System.IO.Path.Combine(root, "Updates"); Directory.CreateDirectory(updates);
            FileStream updateLock;
            try { updateLock = new FileStream(System.IO.Path.Combine(updates, "download.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None); }
            catch (IOException) { return new("Un autre lanceur prépare une mise à jour. La version actuelle reste disponible.", Retry: true); }
            using (updateLock)
            {
                progress?.Report(("Recherche des mises à jour…", 0));
                using var metadataTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation); metadataTimeout.CancelAfter(TimeSpan.FromSeconds(6));
                using var response = await http.GetAsync(Feed, HttpCompletionOption.ResponseHeadersRead, metadataTimeout.Token);
                response.EnsureSuccessStatusCode();
                using var metadata = new MemoryStream(); await CopyLimited(response.Content, metadata, 32768, metadataTimeout.Token);
                using var doc = JsonDocument.Parse(metadata.ToArray()); var j = doc.RootElement;
                if (j.GetProperty("schema").GetInt32() != 1 || !ValidVersion(j.GetProperty("version").GetString(), out var version)) throw new InvalidDataException("Version de mise à jour invalide.");
                string hash = j.GetProperty("sha256").GetString() ?? "", url = j.GetProperty("url").GetString() ?? "";
                long size = j.GetProperty("size").GetInt64();
                if (!ValidHash(hash) || size < 1024 || size > MaximumSize || url != ReleaseRoot + "pc-v" + version.ToString(3) + "/DeadHorizon.exe") throw new InvalidDataException("Le fichier ne correspond pas à une version officielle Dead Horizon.");
                if (version <= current) return new("Le jeu et le lanceur sont à jour · v" + current.ToString(3));
                string target = VersionPath(version); Directory.CreateDirectory(System.IO.Path.GetDirectoryName(target)!);
                if (!Matches(target, hash, size))
                {
                    temporary = target + "." + Guid.NewGuid().ToString("N") + ".part";
                    using var downloadTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation); downloadTimeout.CancelAfter(TimeSpan.FromMinutes(5));
                    using var download = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, downloadTimeout.Token); download.EnsureSuccessStatusCode();
                    if (download.Content.Headers.ContentLength is long length && length != size) throw new InvalidDataException("Taille du téléchargement incorrecte.");
                    using (var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, true))
                    {
                        await using var input = await download.Content.ReadAsStreamAsync(downloadTimeout.Token); byte[] buffer = new byte[65536]; long total = 0; int lastPercent = -1;
                        while (true)
                        {
                            int count = await input.ReadAsync(buffer, downloadTimeout.Token); if (count == 0) break; total += count;
                            if (total > size) throw new InvalidDataException("Le fichier téléchargé est trop volumineux.");
                            await output.WriteAsync(buffer.AsMemory(0, count), downloadTimeout.Token);
                            int percent = (int)(total * 100 / size); if (percent != lastPercent) { lastPercent = percent; progress?.Report(($"Mise à jour v{version.ToString(3)} · téléchargement {percent} %", percent)); }
                        }
                        if (total != size) throw new InvalidDataException("Téléchargement incomplet.");
                        await output.FlushAsync(downloadTimeout.Token);
                    }
                    progress?.Report(("Vérification du téléchargement…", 100));
                    if (!Matches(temporary, hash, size)) throw new InvalidDataException("Le fichier téléchargé est endommagé.");
                    File.Move(temporary, target, true); temporary = null;
                }
                return new("Mise à jour prête. Redémarrage du lanceur…", new(version, hash, size, target));
            }
        }
        catch (OperationCanceledException) when (cancellation.IsCancellationRequested) { throw; }
        catch (Exception e) when (e is HttpRequestException or OperationCanceledException or IOException or InvalidDataException or UnauthorizedAccessException or JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        { return new("Mise à jour indisponible. Tu peux jouer avec la version installée.", Retry: true); }
        finally { if (temporary != null) { try { File.Delete(temporary); } catch { } } }
    }
    static async Task CopyLimited(HttpContent content, Stream destination, int maximum, CancellationToken cancellation)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellation); byte[] buffer = new byte[4096]; int total = 0;
        while (true) { int n = await stream.ReadAsync(buffer, cancellation); if (n == 0) break; total += n; if (total > maximum) throw new InvalidDataException("Métadonnées trop volumineuses."); await destination.WriteAsync(buffer.AsMemory(0, n), cancellation); }
    }
}
