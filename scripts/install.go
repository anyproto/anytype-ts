//go:build ignore

// scripts/install.go — Windows, macOS ve Linux için adım adım (Next-Next-Finish)
// interaktif Anytype kurulum ve güncelleme sihirbazı.
//
// Kullanım:
//   go run scripts/install.go
//
// veya derlenmiş ikili olarak:
//   go build -o install.exe scripts/install.go
//   ./install.exe
package main

import (
	"bufio"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// ─────────────────────────────── Renkler & Konsol ────────────────────────────

const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
	colorCyan   = "\033[36m"
	colorBold   = "\033[1m"
	colorBlue   = "\033[34m"
	colorMagenta= "\033[35m"
)

var reader = bufio.NewReader(os.Stdin)

func clearConsole() {
	if runtime.GOOS == "windows" {
		cmd := exec.Command("cmd", "/c", "cls")
		cmd.Stdout = os.Stdout
		_ = cmd.Run()
	} else {
		fmt.Print("\033[H\033[2J")
	}
}

func printHeader(stepTitle string, stepNum, totalSteps int) {
	fmt.Printf("\n"+colorBold+colorCyan+"================================================================"+colorReset+"\n")
	fmt.Printf(colorBold+colorMagenta+" 🚀 ANYTYPE-TS KURULUM SİHİRBAZI (Next-Next-Finish)"+colorReset+"\n")
	fmt.Printf(colorBold+colorYellow+" [%d/%d] %s"+colorReset+"\n", stepNum, totalSteps, stepTitle)
	fmt.Printf(colorBold+colorCyan+"================================================================"+colorReset+"\n\n")
}

func askPrompt(question, defaultValue string) string {
	if defaultValue != "" {
		fmt.Printf(colorBold+colorGreen+"▶ %s "+colorYellow+"[%s]: "+colorReset, question, defaultValue)
	} else {
		fmt.Printf(colorBold+colorGreen+"▶ %s: "+colorReset, question)
	}

	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)
	if input == "" {
		return defaultValue
	}
	return input
}

func askYesNo(question string, defaultYes bool) bool {
	defStr := "E/h"
	if !defaultYes {
		defStr = "e/H"
	}
	fmt.Printf(colorBold+colorGreen+"▶ %s "+colorYellow+"(%s) [Enter = %s]: "+colorReset, question, defStr, func() string {
		if defaultYes {
			return "Evet"
		}
		return "Hayır"
	}())

	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(strings.ToLower(input))
	if input == "" {
		return defaultYes
	}
	return input == "e" || input == "evet" || input == "y" || input == "yes"
}

// ─────────────────────────────── Main Sihirbaz ───────────────────────────────

func main() {
	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Printf(colorRed+"[HATA] Proje kök dizini bulunamadı: %v\n"+colorReset, err)
		os.Exit(1)
	}

	clearConsole()
	printHeader("Hoş Geldiniz & Dizin Tespiti", 1, 5)
	fmt.Println("Bu sihirbaz, geliştirdiğiniz güncel Anytype arayüzünü ve arka plan")
	fmt.Println("servislerini bilgisayarınızda kurulu olan Anytype üzerine kuracaktır.")
	fmt.Printf("Platform: %s (%s)\n\n", runtime.GOOS, runtime.GOARCH)

	// ADIM 1: Kurulu Anytype dizini bul
	detectedDir := findInstalledResourcesDir()
	var targetResourcesDir string

	if detectedDir != "" {
		fmt.Printf(colorGreen+"[✓] Kurulu Anytype bulundu:\n    %s\n\n"+colorReset, detectedDir)
		if askYesNo("Bu konuma kurulum yapılsın mı?", true) {
			targetResourcesDir = detectedDir
		} else {
			targetResourcesDir = askPrompt("Lütfen Anytype 'resources' dizin yolunu girin", "")
		}
	} else {
		fmt.Println(colorYellow + "[!] Otomatik Anytype kurulumu bulunamadı." + colorReset)
		targetResourcesDir = askPrompt("Lütfen Anytype 'resources' dizin yolunu girin", "")
	}

	if targetResourcesDir == "" || !dirExists(targetResourcesDir) {
		fmt.Printf(colorRed+"\n[HATA] Belirtilen dizin bulunamadı: %s\n"+colorReset, targetResourcesDir)
		os.Exit(1)
	}

	// ADIM 2: Çalışan Anytype uygulamasını kontrol et ve kapat
	printHeader("Çalışan Uygulama Kontrolü", 2, 5)
	if isProcessRunning("Anytype") || isProcessRunning("anytype") {
		fmt.Println(colorYellow + "[!] Anytype şu anda arka planda veya açık durumda çalışıyor." + colorReset)
		fmt.Println("Dosyaların kilitlenmemesi için uygulamanın kapatılması gerekiyor.")
		fmt.Println()
		if askYesNo("Anytype şimdi otomatik olarak kapatılsın mı?", true) {
			killProcess("Anytype")
			time.Sleep(1 * time.Second)
			fmt.Println(colorGreen + "[✓] Anytype kapatıldı." + colorReset)
		} else {
			fmt.Println(colorYellow + "[!] Lütfen Anytype'ı manuel olarak kapatıp Enter'a basın..." + colorReset)
			_, _ = reader.ReadString('\n')
		}
	} else {
		fmt.Println(colorGreen + "[✓] Anytype açık değil, kuruluma devam edilebilir." + colorReset)
	}

	// ADIM 3: UI Derleme Seçeneği
	printHeader("UI Derleme Seçimi (Build)", 3, 5)
	hasDist := dirExists(filepath.Join(repoRoot, "dist"))
	var doBuild bool

	if hasDist {
		fmt.Println("Önceden derlenmiş 'dist/' klasörü mevcut.")
		fmt.Println("  [1] Yeniden baştan derle (Tavsiye edilen / En güncel kodlar)")
		fmt.Println("  [2] Mevcut derlemeyi kullan (Hızlı kurulum)")
		fmt.Println()
		choice := askPrompt("Seçiminiz", "1")
		doBuild = (choice == "1")
	} else {
		fmt.Println(colorYellow + "'dist/' klasörü bulunamadı. Derleme yapılması zorunludur." + colorReset)
		doBuild = true
	}

	if doBuild {
		fmt.Printf("\n" + colorCyan + "▶ UI derleniyor (bun run build)... Lütfen bekleyin...\n" + colorReset)
		if err := executeBuild(repoRoot); err != nil {
			fmt.Printf(colorRed+"\n[HATA] Derleme başarısız oldu: %v\n"+colorReset, err)
			os.Exit(1)
		}
		fmt.Println(colorGreen + "\n[✓] Derleme başarıyla tamamlandı!" + colorReset)
	}

	// ADIM 4: Yedekleme ve Kopyalama / ASAR Güncelleme
	printHeader("Kurulum ve Paketleme", 4, 5)
	fmt.Printf("Hedef: %s\n\n", targetResourcesDir)

	asarPath := filepath.Join(targetResourcesDir, "app.asar")
	asarUnpacked := filepath.Join(targetResourcesDir, "app.asar.unpacked")

	if !fileExists(asarPath) {
		fmt.Printf(colorRed+"[HATA] %s bulunamadı!\n"+colorReset, asarPath)
		os.Exit(1)
	}

	// Yedek oluştur
	backupPath := asarPath + fmt.Sprintf(".backup_%d", time.Now().Unix())
	fmt.Printf(colorCyan+"[1/4] Orijinal app.asar yedekleniyor... (%s)\n"+colorReset, filepath.Base(backupPath))
	if err := copyFile(asarPath, backupPath); err != nil {
		fmt.Printf(colorYellow+"[WARN] Yedek alınamadı: %v\n"+colorReset, err)
	} else {
		fmt.Println(colorGreen + "[✓] Güvenli yedek oluşturuldu." + colorReset)
	}

	// ASAR çıkart
	fmt.Println(colorCyan + "[2/4] ASAR arşivi açılıyor..." + colorReset)
	tmpExtractDir, err := os.MkdirTemp("", "anytype-install-*")
	if err != nil {
		fmt.Printf(colorRed+"[HATA] Geçici dizin açılamadı: %v\n"+colorReset, err)
		os.Exit(1)
	}
	defer os.RemoveAll(tmpExtractDir)

	if err := runCmd("npx", "-y", "asar", "extract", asarPath, tmpExtractDir); err != nil {
		fmt.Printf(colorRed+"[HATA] ASAR çıkartılamadı: %v\n"+colorReset, err)
		os.Exit(1)
	}

	// Dosyaları enjekte et
	fmt.Println(colorCyan + "[3/4] Güncel dist/, electron.js ve yapılandırmalar aktarılıyor..." + colorReset)
	_ = copyDir(filepath.Join(repoRoot, "dist"), filepath.Join(tmpExtractDir, "dist"))
	_ = copyFile(filepath.Join(repoRoot, "electron.js"), filepath.Join(tmpExtractDir, "electron.js"))
	_ = copyDir(filepath.Join(repoRoot, "electron"), filepath.Join(tmpExtractDir, "electron"))

	// ASAR yeniden paketle
	fmt.Println(colorCyan + "[4/4] ASAR arşivi yeniden paketleniyor..." + colorReset)
	tmpNewAsar := filepath.Join(os.TempDir(), fmt.Sprintf("new-app-%d.asar", time.Now().UnixNano()))
	defer os.Remove(tmpNewAsar)

	packArgs := []string{"-y", "asar", "pack", tmpExtractDir, tmpNewAsar}
	unpackGlob := buildUnpackGlob(asarUnpacked)
	if unpackGlob != "" {
		packArgs = append(packArgs, "--unpack", unpackGlob)
	}

	if err := runCmd("npx", packArgs...); err != nil {
		fmt.Printf(colorRed+"[HATA] ASAR paketlenemedi: %v\n"+colorReset, err)
		os.Exit(1)
	}

	// Eski asar'ı değiştir
	_ = os.Remove(asarPath)
	if err := copyFile(tmpNewAsar, asarPath); err != nil {
		fmt.Printf(colorRed+"[HATA] Yeni app.asar kopyalanamadı: %v\n"+colorReset, err)
		os.Exit(1)
	}
	fmt.Println(colorGreen + "[✓] Yeni sürüm başarıyla kurulu Anytype'a uygulandı!" + colorReset)

	// ADIM 5: Bitiş & Başlatma (Finish)
	printHeader("Tebrikler! Kurulum Tamamlandı", 5, 5)
	fmt.Println(colorBold + colorGreen + "🎉 TÜM DEĞİŞİKLİKLER BAŞARIYLA YÜKLENDİ!" + colorReset)
	fmt.Println("\nYüklenen Başlıca Yenilikler:")
	fmt.Println("  ✔ P2P Network Configuration (config.json, static-peers.json, own-addresses.json)")
	fmt.Println("  ✔ Canlı Soket & Peer Bağlantı Testi (Yamux, QUIC, TCP, WebSocket)")
	fmt.Println("  ✔ 12 Saatlik Otomatik Cache Temizleme (Auto-Eviction) & Ultra Hızlı Resim Önbelleği")
	fmt.Println("  ✔ Dairesel Logolar & Temiz Dairesel Seçim Halkalı Sidebar Tasarımı")
	fmt.Println("  ✔ Tema & Tipografi Özelleştirici (Volume Slider'lar, Sistem Fontları Listesi)")
	fmt.Println()

	if askYesNo("Anytype şimdi başlatılsın mı?", true) {
		launchInstalledAnytype(targetResourcesDir)
	}

	fmt.Println(colorBold + colorCyan + "\nKurulum Sihirbazı tamamlandı. Çıkmak için [Enter]'a basın..." + colorReset)
	_, _ = reader.ReadString('\n')
}

// ─────────────────────────────── Yardımcı Fonksiyonlar ────────────────────────

func findRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if fileExists(filepath.Join(dir, "package.json")) && (dirExists(filepath.Join(dir, "src")) || dirExists(filepath.Join(dir, "electron"))) {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("package.json bulunamadı")
}

func findInstalledResourcesDir() string {
	switch runtime.GOOS {
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		progFiles := os.Getenv("ProgramFiles")
		progFilesX86 := os.Getenv("ProgramFiles(x86)")

		candidates := []string{
			filepath.Join(localAppData, "Programs", "Anytype", "resources"),
			filepath.Join(localAppData, "Programs", "anytype", "resources"),
			filepath.Join(localAppData, "Anytype", "resources"),
			filepath.Join(progFiles, "Anytype", "resources"),
			filepath.Join(progFilesX86, "Anytype", "resources"),
		}
		for _, c := range candidates {
			if fileExists(filepath.Join(c, "app.asar")) {
				return c
			}
		}

	case "darwin":
		macPath := "/Applications/Anytype.app/Contents/Resources"
		if fileExists(filepath.Join(macPath, "app.asar")) {
			return macPath
		}

	case "linux":
		home, _ := os.UserHomeDir()
		candidates := []string{
			"/opt/Anytype/resources",
			"/opt/anytype/resources",
			"/usr/share/anytype/resources",
			"/usr/lib/anytype/resources",
			filepath.Join(home, ".local", "share", "Anytype", "resources"),
			filepath.Join(home, ".local", "share", "anytype", "resources"),
		}
		for _, c := range candidates {
			if fileExists(filepath.Join(c, "app.asar")) {
				return c
			}
		}
	}
	return ""
}

func isProcessRunning(name string) bool {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("tasklist")
	} else {
		cmd = exec.Command("pgrep", "-f", name)
	}
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(string(out)), strings.ToLower(name))
}

func killProcess(name string) {
	if runtime.GOOS == "windows" {
		_ = exec.Command("taskkill", "/F", "/IM", name+".exe").Run()
		_ = exec.Command("taskkill", "/F", "/IM", name).Run()
	} else {
		_ = exec.Command("killall", name).Run()
		_ = exec.Command("pkill", "-f", name).Run()
	}
}

func launchInstalledAnytype(resourcesDir string) {
	switch runtime.GOOS {
	case "windows":
		appDir := filepath.Dir(resourcesDir)
		exePath := filepath.Join(appDir, "Anytype.exe")
		if fileExists(exePath) {
			_ = exec.Command("cmd", "/c", "start", "", exePath).Start()
			fmt.Println(colorGreen + "[✓] Anytype başlatıldı." + colorReset)
		}
	case "darwin":
		_ = exec.Command("open", "-a", "Anytype").Start()
		fmt.Println(colorGreen + "[✓] Anytype başlatıldı." + colorReset)
	case "linux":
		_ = exec.Command("anytype").Start()
		fmt.Println(colorGreen + "[✓] Anytype başlatıldı." + colorReset)
	}
}

func ensureBun(repoRoot string) (string, error) {
	// 1. PATH kontrolü
	if p, err := exec.LookPath("bun"); err == nil {
		return p, nil
	}
	if p, err := exec.LookPath("bun.exe"); err == nil {
		return p, nil
	}

	// 2. Varsayılan kurulum dizinleri kontrolü
	home, _ := os.UserHomeDir()
	userProfile := os.Getenv("USERPROFILE")
	localAppData := os.Getenv("LOCALAPPDATA")

	candidates := []string{
		filepath.Join(userProfile, ".bun", "bin", "bun.exe"),
		filepath.Join(localAppData, "bun", "bin", "bun.exe"),
		filepath.Join(home, ".bun", "bin", "bun"),
		filepath.Join(home, ".bun", "bin", "bun.exe"),
	}

	for _, c := range candidates {
		if fileExists(c) {
			dir := filepath.Dir(c)
			_ = os.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
			return c, nil
		}
	}

	// 3. Bulunamadı — Kullanıcı onayıyla otomatik indir ve kur
	fmt.Printf(colorYellow + "\n[!] 'bun' paket yöneticisi sisteminizde bulunamadı.\n" + colorReset)
	fmt.Println("Anytype arayüzünün derlenmesi için Bun gereklidir.")
	if !askYesNo("Bun otomatik olarak indirilip kurulsun mu?", true) {
		return "", fmt.Errorf("bun kurulumu kullanıcı tarafından iptal edildi")
	}

	fmt.Println(colorCyan + "\n▶ Bun indiriliyor ve kuruluyor..." + colorReset)

	if runtime.GOOS == "windows" {
		cmd := exec.Command("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm bun.sh/install.ps1 | iex")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("powershell üzerinden bun kurulumu başarısız: %v", err)
		}
	} else {
		cmd := exec.Command("bash", "-c", "curl -fsSL https://bun.sh/install | bash")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("curl üzerinden bun kurulumu başarısız: %v", err)
		}
	}

	// Kurulum sonrası tekrar kontrol et
	for _, c := range candidates {
		if fileExists(c) {
			dir := filepath.Dir(c)
			_ = os.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
			fmt.Printf(colorGreen + "[✓] Bun başarıyla kuruldu: %s\n" + colorReset, c)
			return c, nil
		}
	}

	if p, err := exec.LookPath("bun"); err == nil {
		return p, nil
	}

	return "bun", nil
}

func executeBuild(repoRoot string) error {
	bunPath, err := ensureBun(repoRoot)
	if err != nil {
		return err
	}

	// node_modules yoksa önce bun install çalıştır
	nodeModules := filepath.Join(repoRoot, "node_modules")
	if !dirExists(nodeModules) {
		fmt.Println(colorCyan + "▶ Gerekli bağımlılıklar kuruluyor (bun install)..." + colorReset)
		cmdInstall := exec.Command(bunPath, "install")
		cmdInstall.Dir = repoRoot
		cmdInstall.Stdout = os.Stdout
		cmdInstall.Stderr = os.Stderr
		if err := cmdInstall.Run(); err != nil {
			return fmt.Errorf("bun install başarısız: %v", err)
		}
		fmt.Println(colorGreen + "[✓] Bağımlılıklar kuruldu.\n" + colorReset)
	}

	fmt.Printf(colorCyan + "▶ UI derleniyor (%s run build)...\n" + colorReset, bunPath)
	cmd := exec.Command(bunPath, "run", "build")
	cmd.Dir = repoRoot
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func buildUnpackGlob(unpackedDir string) string {
	if !dirExists(unpackedDir) {
		return ""
	}
	extSet := map[string]bool{}
	nameSet := map[string]bool{}

	_ = filepath.WalkDir(unpackedDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		ext := filepath.Ext(d.Name())
		if ext != "" {
			extSet["**/*"+ext] = true
		} else {
			nameSet["**/"+d.Name()] = true
		}
		return nil
	})

	var patterns []string
	for k := range extSet {
		patterns = append(patterns, k)
	}
	for k := range nameSet {
		patterns = append(patterns, k)
	}
	if len(patterns) == 0 {
		return ""
	}
	if len(patterns) == 1 {
		return patterns[0]
	}
	return "{" + strings.Join(patterns, ",") + "}"
}

func runCmd(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func fileExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && !st.IsDir()
}

func dirExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && st.IsDir()
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func copyDir(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		return copyFile(path, target)
	})
}
