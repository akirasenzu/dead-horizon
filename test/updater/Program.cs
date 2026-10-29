using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using DeadHorizon;

var root = Path.Combine(Path.GetTempPath(), "DeadHorizon-update-tests-" + Guid.NewGuid().ToString("N")); Directory.CreateDirectory(root);
var bytes = Enumerable.Range(0, 8192).Select(i => (byte)(i % 251)).ToArray();
string hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
int passed = 0;
void Check(bool value, string message) { if (!value) throw new Exception(message); passed++; }
string Manifest(string version="2.2.9", string? checksum=null, long? size=null, string? url=null) => JsonSerializer.Serialize(new { schema=1,version,sha256=checksum??hash,size=size??bytes.Length,url=url??$"https://github.com/akirasenzu/dead-horizon/releases/download/pc-v{version}/DeadHorizon.exe" });
UpdateManager Manager(string folder, Func<HttpRequestMessage,HttpResponseMessage> response, string version="2.2.0") => new(folder,Version.Parse(version),new HttpClient(new FixtureHandler(response)));
HttpResponseMessage Json(string text) => new(HttpStatusCode.OK){Content=new StringContent(text)};
HttpResponseMessage Binary(byte[] data) => new(HttpStatusCode.OK){Content=new ByteArrayContent(data)};
try
{
    string installed = Path.Combine(root,"original-DeadHorizon.exe");File.WriteAllText(installed,"unchanged original bootstrap");
    var manager=Manager(root,r=>r.RequestUri!.AbsoluteUri==UpdateManager.Feed?Json(Manifest()):Binary(bytes));
    var update=await manager.PrepareAsync(null);Check(update.Update?.Version==new Version(2,2,9),"Newer version must be prepared");
    Check(File.ReadAllBytes(update.Update!.Path).SequenceEqual(bytes),"Downloaded file must match the release");
    Check(manager.CachedUpdate()==null,"Downloading must not activate an update");
    manager.Activate(update.Update);Check(manager.CachedUpdate()?.Version==new Version(2,2,9),"A later launch from the original bootstrap must find the verified update");
    Check(File.ReadAllText(installed)=="unchanged original bootstrap","The running/original executable must never be overwritten");
    var current=Manager(root,_=>Json(Manifest()),"2.2.9");Check((await current.PrepareAsync(null)).Update==null,"The current version must not update itself");Check(current.CachedUpdate()==null,"Cached current version must not loop into itself");
    var older=Manager(root,_=>Json(Manifest("2.1.7")));Check((await older.PrepareAsync(null)).Update==null,"Release rollback must not silently downgrade a newer launcher");
    var offline=Manager(root,_=>throw new HttpRequestException("offline"));Check((await offline.PrepareAsync(null)).Retry,"Offline startup must return control to the installed launcher");Check(offline.CachedUpdate()!=null,"Offline startup must still be able to launch the last cached release");
    var reused=Manager(root,r=>r.RequestUri!.AbsoluteUri==UpdateManager.Feed?Json(Manifest()):throw new Exception("Should not download again"));Check((await reused.PrepareAsync(null)).Update!=null,"A verified download should be reused after an interrupted activation");
    string badRoot=Path.Combine(root,"bad");var bad=Manager(badRoot,r=>r.RequestUri!.AbsoluteUri==UpdateManager.Feed?Json(Manifest(checksum:new string('0',64))):Binary(bytes));Check((await bad.PrepareAsync(null)).Update==null,"Checksum mismatch must reject installation");Check(!Directory.EnumerateFiles(badRoot,"*.part",SearchOption.AllDirectories).Any(),"Corrupt temporary downloads must be removed");Check(bad.CachedUpdate()==null,"Corrupt download must not become active");
    var external=Manager(Path.Combine(root,"external"),_=>Json(Manifest(url:"https://untrusted.example/DeadHorizon.exe")));Check((await external.PrepareAsync(null)).Update==null,"An external executable URL must be rejected");
    var shortFile=Manager(Path.Combine(root,"short"),r=>r.RequestUri!.AbsoluteUri==UpdateManager.Feed?Json(Manifest()):Binary(bytes[..4000]));Check((await shortFile.PrepareAsync(null)).Update==null,"Truncated downloads must be rejected");
    var oversize=Manager(Path.Combine(root,"oversize"),_=>Json(Manifest(size:201L*1024*1024)));Check((await oversize.PrepareAsync(null)).Update==null,"Oversized release must be rejected before download");
    var metadata=Manager(Path.Combine(root,"metadata"),_=>Json(new string('x',40000)));Check((await metadata.PrepareAsync(null)).Update==null,"Oversized metadata must be rejected");
    var cancelled=new CancellationTokenSource();cancelled.Cancel();bool threw=false;try{await manager.PrepareAsync(null,cancelled.Token);}catch(OperationCanceledException){threw=true;}Check(threw,"Closing the launcher must cancel downloading");
    using(var locked=new FileStream(Path.Combine(root,"Updates","download.lock"),FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None)){Check((await manager.PrepareAsync(null)).Retry,"Two launchers must not download into the cache concurrently");}
    File.WriteAllBytes(update.Update.Path,new byte[bytes.Length]);Check(manager.CachedUpdate()==null,"Tampered/corrupted cached executable must not be launched");
    bool activated=false;try{manager.Activate(update.Update);activated=true;}catch(InvalidDataException){}Check(!activated,"Activation must recheck integrity");
    Console.WriteLine($"{passed} updater checks passed: download, integrity, activation, offline, interruption, cancellation, locking and rollback protection.");
}
finally { var expectedPrefix=Path.Combine(Path.GetFullPath(Path.GetTempPath()),"DeadHorizon-update-tests-");if(!Path.GetFullPath(root).StartsWith(expectedPrefix,StringComparison.OrdinalIgnoreCase))throw new IOException("Unexpected test cleanup path");Directory.Delete(root,true); }

sealed class FixtureHandler(Func<HttpRequestMessage,HttpResponseMessage> response) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken cancellationToken){cancellationToken.ThrowIfCancellationRequested();return Task.FromResult(response(request));}
}
