using System.Diagnostics;
using System.IO.Compression;
using System.Management;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DeadHorizon;

static class Program
{
    public static readonly string Data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DeadHorizon");
    public static readonly JsonSerializerOptions Json = new() { WriteIndented = true, PropertyNameCaseInsensitive = true };
    internal static Version Version { get { var v=Assembly.GetExecutingAssembly().GetName().Version!;return new(v.Major,v.Minor,v.Build); } }
    internal static readonly HttpClient UpdateClient = UpdateManager.CreateClient();
    internal static UpdateManager Updates => new(Data,Version,UpdateClient);
    internal static void StartUpdated(string path,bool installedNow=true) { var start=new ProcessStartInfo(path){UseShellExecute=false,WorkingDirectory=Path.GetDirectoryName(path)!};if(installedNow)start.ArgumentList.Add("--updated");_ = Process.Start(start) ?? throw new IOException("Le nouveau lanceur n’a pas pu démarrer."); }
    [STAThread]
    static void Main(string[] args)
    {
        Directory.CreateDirectory(Data);
        if(args.Length==0 || args.SequenceEqual(new[]{"--updated"})) {
            try { var cached=Updates.CachedUpdate();if(cached!=null){StartUpdated(cached.Path,false);return;} }catch(Exception e){Log("Lancement de la version en cache : "+e.Message);}
        }
        ApplicationConfiguration.Initialize();
        Application.ThreadException += (_, e) => Report(e.Exception);
        AppDomain.CurrentDomain.UnhandledException += (_, e) => Log(e.ExceptionObject.ToString() ?? "Erreur inconnue");
        try
        {
            if (args.Length == 2 && args[0] == "--self-test")
            {
                var hardware = Hardware.Detect(); var assets = Assets.Extract();
                var config = new Settings(); var roundtrip = JsonSerializer.Deserialize<Settings>(JsonSerializer.Serialize(config, Json), Json)!;
                var offline = Directory.GetFiles(assets, "*.js", SearchOption.AllDirectories).All(p => !File.ReadAllText(p).Contains("cdn.jsdelivr.net"));
                File.WriteAllText(args[1], JsonSerializer.Serialize(new { ok = File.Exists(Path.Combine(assets,"hazebrouck-map.json")) && offline && roundtrip.Fps == 60, hardware, assets, offline, webViewVersion = CoreWebView2Environment.GetAvailableBrowserVersionString(), presets = new[]{"eco","balanced","high"}.Select(Quality.For) }, Json));
                return;
            }
            Application.Run(new Launcher(args.Length == 2 && args[0] == "--smoke-test" ? args[1] : null,args.SequenceEqual(new[]{"--updated"})));
        }
        catch (Exception e) { Report(e); }
    }
    public static void Log(string text) { try { File.AppendAllText(Path.Combine(Data, "launcher.log"), DateTime.Now.ToString("s") + " " + text + Environment.NewLine); } catch { } }
    public static void Report(Exception e) { Log(e.ToString()); MessageBox.Show("Le lanceur a rencontré une erreur.\n" + e.Message + "\n\nLe détail est enregistré dans " + Path.Combine(Data, "launcher.log"), "Dead Horizon", MessageBoxButtons.OK, MessageBoxIcon.Error); }
}

record Quality(string Name, double Scale, int ShadowSize, int Distance, bool Shadows)
{
    public static Quality For(string name) => name switch { "eco" => new("Économique", .8, 512, 420, false), "high" => new("Élevée", 1.5, 1536, 900, true), _ => new("Équilibrée", 1, 1024, 650, true) };
}
sealed class Settings
{
    public string Quality { get; set; } = "auto";
    public string Resolution { get; set; } = "1600 × 900";
    public bool Fullscreen { get; set; } = false;
    public int Fps { get; set; } = 60;
    public static string FilePath => Path.Combine(Program.Data, "settings.json");
    public static Settings Load() { try { return JsonSerializer.Deserialize<Settings>(File.ReadAllText(FilePath), Program.Json) ?? new(); } catch { return new(); } }
    public void Save() { var temp = FilePath + ".tmp"; File.WriteAllText(temp, JsonSerializer.Serialize(this, Program.Json)); File.Move(temp, FilePath, true); }
}
sealed record Hardware(string Cpu, int Threads, double RamGb, string Gpu, double VramGb, bool Dedicated, string Recommended)
{
    [StructLayout(LayoutKind.Sequential)] struct MemoryStatus { public uint Length, Load; public ulong TotalPhysical, AvailablePhysical, TotalPageFile, AvailablePageFile, TotalVirtual, AvailableVirtual, AvailableExtendedVirtual; }
    [DllImport("kernel32.dll", CharSet=CharSet.Auto)] static extern bool GlobalMemoryStatusEx(ref MemoryStatus value);
    public static Hardware Detect()
    {
        var memory = new MemoryStatus { Length = (uint)Marshal.SizeOf<MemoryStatus>() }; GlobalMemoryStatusEx(ref memory);
        string cpu = Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "Processeur Windows")?.ToString()?.Trim() ?? "Processeur Windows";
        string gpu = "Carte graphique gérée par Windows"; double vram = 0; bool dedicated = false;
        try
        {
            using var query = new ManagementObjectSearcher("SELECT Name,AdapterRAM FROM Win32_VideoController");
            foreach (ManagementObject item in query.Get())
            {
                using (item) { string name = item["Name"]?.ToString() ?? ""; bool discrete = name.Contains("NVIDIA",StringComparison.OrdinalIgnoreCase) || name.Contains("Radeon RX",StringComparison.OrdinalIgnoreCase) || name.Contains("RTX",StringComparison.OrdinalIgnoreCase) || name.Contains("Arc",StringComparison.OrdinalIgnoreCase);
                    double ram = Convert.ToDouble(item["AdapterRAM"] ?? 0) / 1073741824d;
                    if (gpu.StartsWith("Carte graphique") || discrete && !dedicated || discrete == dedicated && ram > vram) { gpu=name;vram=ram;dedicated=discrete; }
                }
            }
        } catch { }
        double total = Math.Round(memory.TotalPhysical / 1073741824d,1); int threads = Environment.ProcessorCount;
        string recommended = total < 8 || threads < 4 || !dedicated ? "eco" : "balanced";
        return new(cpu, threads, total, gpu, Math.Round(vram,1), dedicated, recommended);
    }
}

static class Assets
{
    public static string Extract()
    {
        using var data = Assembly.GetExecutingAssembly().GetManifestResourceStream("DeadHorizon.Game.zip") ?? throw new InvalidOperationException("Jeu embarqué introuvable.");
        string version = Convert.ToHexString(SHA256.HashData(data))[..16]; data.Position=0;
        string destination = Path.Combine(Program.Data, "Game", version);
        if (File.Exists(Path.Combine(destination,".ready"))) return destination;
        Directory.CreateDirectory(destination); using var archive = new ZipArchive(data,ZipArchiveMode.Read);
        foreach (var entry in archive.Entries)
        {
            string target = Path.GetFullPath(Path.Combine(destination,entry.FullName));
            if (!target.StartsWith(destination + Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Chemin d’archive invalide.");
            if (entry.Name.Length == 0) { Directory.CreateDirectory(target);continue; }
            Directory.CreateDirectory(Path.GetDirectoryName(target)!); entry.ExtractToFile(target,true);
        }
        File.WriteAllText(Path.Combine(destination,".ready"),version);return destination;
    }
}

sealed class Launcher : Form
{
    static readonly Color Ink=Color.FromArgb(17,28,23), PanelColor=Color.FromArgb(26,42,34), Muted=Color.FromArgb(169,185,163), Accent=Color.FromArgb(241,154,89);
    readonly ComboBox quality=new(),resolution=new(),fps=new(); readonly CheckBox fullscreen=new();
    readonly Label pc=new(),recommendation=new(),status=new(); readonly Button play=new(),detect=new(),retryUpdate=new();
    readonly ProgressBar updateProgress=new();readonly CancellationTokenSource shutdown=new();bool starting=true,checkingUpdate;
    Hardware? hardware; readonly Settings settings=Settings.Load(); readonly string? smoke;
    public Launcher(string? smokePath,bool justUpdated=false)
    {
        smoke=smokePath;Text="Dead Horizon — Lanceur";ClientSize=new Size(960,660);MinimumSize=new Size(850,660);BackColor=Ink;ForeColor=Color.FromArgb(237,236,216);Font=new Font("Segoe UI",10);StartPosition=FormStartPosition.CenterScreen;AutoScaleMode=AutoScaleMode.Dpi;
        var title=LabelAt("DEAD HORIZON",36,28,650,58,32,FontStyle.Bold);Controls.Add(title);Controls.Add(LabelAt("v"+Program.Version.ToString(3),790,50,135,25,11,FontStyle.Regular,Muted));
        Controls.Add(LabelAt("HAZEBROUCK  /  SERVEUR COMMUN",39,90,740,25,10,FontStyle.Bold,Accent));
        Controls.Add(LabelAt("Rejoins les autres sur le serveur commun. Le mode solo reste disponible hors connexion.",39,123,840,25,11,FontStyle.Regular,Muted));
        var pcCard=new Panel{Location=new Point(36,172),Size=new Size(430,268),BackColor=PanelColor};Controls.Add(pcCard);
        pcCard.Controls.Add(LabelAt("VOTRE PC",20,17,390,25,10,FontStyle.Bold,Accent));
        pc.Location=new Point(20,52);pc.Size=new Size(389,118);pc.ForeColor=Muted;pc.Font=new Font("Segoe UI",10);pc.Text="Détection du matériel…";pcCard.Controls.Add(pc);
        recommendation.Location=new Point(20,177);recommendation.Size=new Size(390,32);recommendation.ForeColor=Accent;pcCard.Controls.Add(recommendation);
        StyleButton(detect,"DÉTECTER À NOUVEAU",20,218,250,34,false);detect.Click+=async(_,_)=>await Detect();pcCard.Controls.Add(detect);
        var config=new Panel{Location=new Point(486,172),Size=new Size(438,360),BackColor=PanelColor};Controls.Add(config);
        config.Controls.Add(LabelAt("RÉGLAGES DU JEU",20,17,390,25,10,FontStyle.Bold,Accent));
        AddCombo(config,"Qualité graphique",quality,52,new[]{"Automatique (conseillé)","Économique","Équilibrée","Élevée"});
        AddCombo(config,"Résolution de la fenêtre",resolution,126,new[]{"1280 × 720","1600 × 900","1920 × 1080","Écran actuel"});
        AddCombo(config,"Images par seconde",fps,200,new[]{"30","60","120","Sans limite"});
        fullscreen.Text="Plein écran sans bordure";fullscreen.Location=new Point(20,289);fullscreen.Size=new Size(390,32);fullscreen.Checked=settings.Fullscreen;config.Controls.Add(fullscreen);
        Controls.Add(LabelAt("F5 : vue · I : inventaire · M : carte\nF11 / Alt + Entrée : plein écran · Alt + F4 : quitter le jeu",39,459,425,62,10,FontStyle.Regular,Muted));
        status.Location=new Point(38,555);status.Size=new Size(670,34);status.AutoEllipsis=true;status.ForeColor=Muted;status.Text="Réglages enregistrés uniquement sur ce PC.";Controls.Add(status);
        updateProgress.Location=new Point(38,540);updateProgress.Size=new Size(884,5);updateProgress.Visible=false;Controls.Add(updateProgress);
        StyleButton(retryUpdate,"RÉESSAYER LA MISE À JOUR",716,553,208,33,false);retryUpdate.Font=new Font("Segoe UI",8,FontStyle.Bold);retryUpdate.Visible=false;retryUpdate.Click+=async(_,_)=>await CheckUpdates();Controls.Add(retryUpdate);
        StyleButton(play,"JOUER À DEAD HORIZON  →",36,596,888,44,true);play.Enabled=false;play.Click+=async(_,_)=>await StartGame();Controls.Add(play);
        quality.SelectedIndex=Array.IndexOf(new[]{"auto","eco","balanced","high"},settings.Quality);if(quality.SelectedIndex<0)quality.SelectedIndex=0;
        resolution.SelectedItem=settings.Resolution;if(resolution.SelectedIndex<0)resolution.SelectedIndex=1;fps.SelectedIndex=settings.Fps==30?0:settings.Fps==120?2:settings.Fps==0?3:1;
        Shown+=async(_,_)=>{await Detect();if(smoke!=null){starting=false;await StartGame();return;}await CheckUpdates(justUpdated);};
        FormClosing+=(_,_)=>{shutdown.Cancel();SaveSettings();};
    }
    static Label LabelAt(string text,int x,int y,int w,int h,float size,FontStyle style=FontStyle.Regular,Color? color=null)=>new(){Text=text,Location=new Point(x,y),Size=new Size(w,h),Font=new Font("Segoe UI",size,style),ForeColor=color??Color.FromArgb(237,236,216)};
    static void StyleButton(Button b,string text,int x,int y,int w,int h,bool primary){b.Text=text;b.Location=new Point(x,y);b.Size=new Size(w,h);b.FlatStyle=FlatStyle.Flat;b.FlatAppearance.BorderColor=primary?Accent:Color.FromArgb(78,100,82);b.BackColor=primary?Accent:PanelColor;b.ForeColor=primary?Ink:Color.FromArgb(237,236,216);b.Font=new Font("Segoe UI",10,FontStyle.Bold);b.Cursor=Cursors.Hand;}
    static void AddCombo(Panel parent,string title,ComboBox box,int y,string[] items){parent.Controls.Add(LabelAt(title,20,y,390,22,9,FontStyle.Regular,Muted));box.Location=new Point(20,y+25);box.Size=new Size(390,30);box.DropDownStyle=ComboBoxStyle.DropDownList;box.Items.AddRange(items);box.BackColor=Ink;box.ForeColor=Color.FromArgb(237,236,216);parent.Controls.Add(box);}
    async Task Detect(){detect.Enabled=false;play.Enabled=false;try{hardware=await Task.Run(Hardware.Detect);pc.Text=$"{hardware.Cpu}\n{hardware.Threads} processeurs logiques · {hardware.RamGb:0.#} Go de mémoire\n\n{hardware.Gpu}";recommendation.Text="Profil conseillé : "+Quality.For(hardware.Recommended).Name;status.Text="Matériel détecté. La qualité automatique s’adapte aussi pendant la partie.";}catch(Exception e){hardware=new("Processeur Windows",Environment.ProcessorCount,0,"Détection partielle",0,false,"eco");pc.Text="Détection partielle. Le profil économique reste disponible.";Program.Log(e.Message);}finally{detect.Enabled=true;play.Enabled=!starting&&!checkingUpdate;}}
    async Task CheckUpdates(bool installedNow=false)
    {
        if(checkingUpdate)return;checkingUpdate=true;play.Enabled=false;detect.Enabled=false;retryUpdate.Visible=false;updateProgress.Visible=true;updateProgress.Value=0;
        try {
            var progress=new Progress<(string Text,int Percent)>(p=>{if(!IsDisposed){status.Text=p.Text;updateProgress.Value=Math.Clamp(p.Percent,0,100);}});
            var result=await Program.Updates.PrepareAsync(progress,shutdown.Token);if(IsDisposed||shutdown.IsCancellationRequested)return;
            status.Text=installedNow&&result.Update==null&&!result.Retry?"Version v"+Program.Version.ToString(3)+" à jour · réglages conservés.":result.Message;retryUpdate.Visible=result.Retry;
            if(result.Update is { } update){SaveSettings();Program.StartUpdated(update.Path);try{Program.Updates.Activate(update);}catch(Exception e){Program.Log("Mémorisation de la mise à jour : "+e.Message);}Close();return;}
        }catch(OperationCanceledException)when(shutdown.IsCancellationRequested){}
        catch(Exception e){Program.Log("Mise à jour : "+e.Message);if(!IsDisposed){status.Text="La version installée reste disponible. Réessaie la mise à jour plus tard.";retryUpdate.Visible=true;}}
        finally{starting=false;checkingUpdate=false;if(!IsDisposed){play.Enabled=true;detect.Enabled=true;updateProgress.Visible=false;}}
    }
    void SaveSettings(){settings.Quality=new[]{"auto","eco","balanced","high"}[Math.Max(0,quality.SelectedIndex)];settings.Resolution=resolution.SelectedItem?.ToString()??"1600 × 900";settings.Fps=fps.SelectedIndex switch{0=>30,2=>120,3=>0,_=>60};settings.Fullscreen=fullscreen.Checked;try{settings.Save();}catch(Exception e){Program.Log(e.Message);}}
    async Task StartGame()
    {
        play.Enabled=false;status.Text="Préparation du jeu…";
        try
        {
            SaveSettings();var selected=Quality.For(settings.Quality=="auto"?hardware?.Recommended??"eco":settings.Quality);
            var folder=await Task.Run(Assets.Extract);var game=new GameWindow(folder,settings,selected,smoke);
            Hide();game.ShowDialog(this);game.Dispose();if(smoke!=null){Close();return;}Show();Activate();status.Text="Partie fermée. Tes réglages sont conservés.";
        }
        catch(Exception e){Show();Program.Report(e);if(smoke!=null){File.WriteAllText(smoke,JsonSerializer.Serialize(new{ok=false,error=e.ToString()},Program.Json));Close();}}
        finally{play.Enabled=true;}
    }
}

sealed class GameWindow : Form
{
    readonly WebView2 view=new(){Dock=DockStyle.Fill,DefaultBackgroundColor=Color.FromArgb(17,28,23)};
    readonly string folder;readonly Settings settings;readonly Quality quality;readonly string? smoke;
    Rectangle savedBounds;FormWindowState savedState;bool full;
    public GameWindow(string assets,Settings config,Quality profile,string? smokePath)
    {
        folder=assets;settings=config;quality=profile;smoke=smokePath;Text="Dead Horizon — Hazebrouck";BackColor=Color.FromArgb(17,28,23);StartPosition=FormStartPosition.CenterScreen;MinimumSize=new Size(800,520);
        var screen=Screen.PrimaryScreen?.WorkingArea??new Rectangle(0,0,1280,720);var dimensions=settings.Resolution.Split('×');int w=1600,h=900;if(dimensions.Length==2){int.TryParse(dimensions[0].Trim(),out w);int.TryParse(dimensions[1].Trim(),out h);}else{w=screen.Width;h=screen.Height;}
        ClientSize=new Size(Math.Clamp(w,800,Math.Max(800,screen.Width-32)),Math.Clamp(h,480,Math.Max(480,screen.Height-80)));Controls.Add(view);
        Shown+=async(_,_)=>await Initialize();FormClosed+=(_,_)=>view.Dispose();
    }
    void ToggleFullscreen(){if(!full){savedBounds=Bounds;savedState=WindowState;WindowState=FormWindowState.Normal;FormBorderStyle=FormBorderStyle.None;Bounds=Screen.FromControl(this).Bounds;full=true;}else{FormBorderStyle=FormBorderStyle.Sizable;WindowState=FormWindowState.Normal;Bounds=savedBounds;WindowState=savedState;full=false;}}
    async Task Initialize()
    {
        try
        {
            var environment=await CoreWebView2Environment.CreateAsync(null,Path.Combine(Program.Data,"Profile"));await view.EnsureCoreWebView2Async(environment);var core=view.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping("dead-horizon.example",folder,CoreWebView2HostResourceAccessKind.Deny);
            core.Settings.AreBrowserAcceleratorKeysEnabled=false;core.Settings.AreDefaultContextMenusEnabled=false;core.Settings.IsStatusBarEnabled=false;core.Settings.IsZoomControlEnabled=false;core.Settings.AreDevToolsEnabled=false;
            core.NavigationStarting+=(_,e)=>{if(!e.Uri.StartsWith("https://dead-horizon.example/",StringComparison.Ordinal))e.Cancel=true;};
            core.NewWindowRequested+=(_,e)=>{e.Handled=true;};
            core.PermissionRequested+=(_,e)=>{e.State=e.PermissionKind.ToString()=="PointerLock"?CoreWebView2PermissionState.Allow:CoreWebView2PermissionState.Deny;};
            core.DownloadStarting+=(_,e)=>e.Cancel=true;
            core.ProcessFailed+=(_,e)=>{Program.Log("Moteur du jeu : "+e.ProcessFailedKind);MessageBox.Show(this,"Le moteur graphique s’est arrêté. Ferme cette fenêtre et relance le jeu en qualité Économique.","Dead Horizon");};
            core.WebMessageReceived+=(_,e)=>{
                if(!e.Source.StartsWith("https://dead-horizon.example/",StringComparison.Ordinal))return;
                using var document=JsonDocument.Parse(e.WebMessageAsJson);var root=document.RootElement;
                if(root.TryGetProperty("type",out var command)&&command.GetString()=="fullscreen"){ToggleFullscreen();return;}
                if(root.TryGetProperty("type",out var type)&&type.GetString()=="ready")
                {
                    Program.Log("Jeu chargé — "+root.GetRawText());
                    if(smoke!=null){File.WriteAllText(smoke,JsonSerializer.Serialize(new{ok=true,ready=root.Clone(),webViewVersion=environment.BrowserVersionString},Program.Json));var timer=new System.Windows.Forms.Timer{Interval=1000};timer.Tick+=(_,_)=>{timer.Stop();timer.Dispose();Close();};timer.Start();}
                }
            };
            var selectedResolution=settings.Resolution.Split('×');int renderWidth=0,renderHeight=0;if(selectedResolution.Length==2){int.TryParse(selectedResolution[0].Trim(),out renderWidth);int.TryParse(selectedResolution[1].Trim(),out renderHeight);}
            var runtime=new{serverUrl="https://dead-horizon-coop-291026.keentoad34.chatgpt.site",quality=settings.Quality,profile=quality.Name,renderScale=quality.Scale,renderWidth,renderHeight,shadows=quality.Shadows,shadowSize=quality.ShadowSize,viewDistance=quality.Distance,fps=settings.Fps,adaptive=settings.Quality=="auto"};
            await core.AddScriptToExecuteOnDocumentCreatedAsync("window.DEAD_HORIZON_CONFIG="+JsonSerializer.Serialize(runtime)+";");
            core.Navigate("https://dead-horizon.example/index.html");if(settings.Fullscreen)ToggleFullscreen();view.Focus();
            if(smoke!=null){var timeout=new System.Windows.Forms.Timer{Interval=45000};timeout.Tick+=(_,_)=>{timeout.Stop();timeout.Dispose();if(!File.Exists(smoke))File.WriteAllText(smoke,"{\"ok\":false,\"error\":\"Le jeu n’a pas confirmé son chargement en 45 secondes.\"}");Close();};timeout.Start();FormClosed+=(_,_)=>timeout.Dispose();}
        }
        catch(WebView2RuntimeNotFoundException){MessageBox.Show(this,"Le composant Microsoft Edge WebView2 est nécessaire. Installe le runtime Evergreen depuis le site officiel Microsoft, puis relance Dead Horizon.\nhttps://developer.microsoft.com/microsoft-edge/webview2/", "Composant manquant");Close();}
        catch(Exception e){Program.Report(e);if(smoke!=null)File.WriteAllText(smoke,JsonSerializer.Serialize(new{ok=false,error=e.ToString()},Program.Json));Close();}
    }
}
