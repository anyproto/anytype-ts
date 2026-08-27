//go:build ignore

// deploy.go — Anytype-ts UI'ını derler ve kurulu Anytype uygulamasına kopyalar.
//
// Kullanım:
//
//	go run scripts/deploy.go [--no-build] [--app-path /özel/yol]
//
// Platform desteği: macOS, Linux, Windows.
package main

import (
	"flag"
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


// ─────────────────────────────── Flags ───────────────────────────────────────

var (
	flagNoBuild = flag.Bool("no-build", false, "UI derlemesini atla, sadece kopyala")
	flagAppPath = flag.String("app-path", "", "Kurulu Anytype dizinini manuel belirt")
	flagDryRun  = flag.Bool("dry-run", false, "Kopyalama yapmadan ne yapılacağını göster")
	flagVerbose = flag.Bool("v", false, "Ayrıntılı çıktı")
)

// ─────────────────────────────── Renkler ─────────────────────────────────────

const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
	colorCyan   = "\033[36m"
	colorBold   = "\033[1m"
)

func info(format string, a ...any)    { fmt.Printf(colorCyan+"[INFO]  "+colorReset+format+"\n", a...) }
func ok(format string, a ...any)      { fmt.Printf(colorGreen+"[OK]    "+colorReset+format+"\n", a...) }
func warn(format string, a ...any)    { fmt.Printf(colorYellow+"[WARN]  "+colorReset+format+"\n", a...) }
func fatal(format string, a ...any)   { fmt.Printf(colorRed+"[ERROR] "+colorReset+format+"\n", a...); os.Exit(1) }
func verbose(format string, a ...any) { if *flagVerbose { fmt.Printf("        "+format+"\n", a...) } }

// ─────────────────────────────── Main ────────────────────────────────────────

func main() {
	flag.Parse()

	start := time.Now()
	fmt.Printf(colorBold+"\n🚀 Anytype-ts Deploy Script\n"+colorReset)
	fmt.Printf("   Platform : %s/%s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("   Dry-run  : %v\n\n", *flagDryRun)

	// 1. Proje kök dizini
	repoRoot := mustRepoRoot()
	info("Proje kökü: %s", repoRoot)

	// 2. UI derle
	if !*flagNoBuild {
		buildUI(repoRoot)
	} else {
		warn("--no-build: derleme atlandı")
	}

	// 3. Kurulu uygulama dizinini bul
	appResourcesDir := findAppResourcesDir(repoRoot)
	info("Uygulama resources dizini: %s", appResourcesDir)

	// 4. ASAR'ı çöz
	asarPath := filepath.Join(appResourcesDir, "app.asar")
	asarUnpacked := filepath.Join(appResourcesDir, "app.asar.unpacked")
	tmpDir := extractAsar(asarPath)
	defer os.RemoveAll(tmpDir)

	// 5. dist/ klasörünü kopyala (ASAR extract dizinine)
	srcDist := filepath.Join(repoRoot, "dist")
	dstDist := filepath.Join(tmpDir, "dist")
	info("dist/ kopyalanıyor...")
	mustCopyDir(srcDist, dstDist)
	ok("dist/ kopyalandı")

	// 6. electron.js dosyasını kopyala
	srcElectronJs := filepath.Join(repoRoot, "electron.js")
	dstElectronJs := filepath.Join(tmpDir, "electron.js")
	if fileExists(srcElectronJs) {
		info("electron.js kopyalanıyor...")
		mustCopyFile(srcElectronJs, dstElectronJs)
		ok("electron.js kopyalandı")
	} else {
		warn("electron.js bulunamadı, atlandı")
	}

	// 7. electron/ dizinini kopyala (json + img, ts bundle değil)
	srcElectronDir := filepath.Join(repoRoot, "electron")
	dstElectronDir := filepath.Join(tmpDir, "electron")
	info("electron/ dizini kopyalanıyor...")
	mustCopyDir(srcElectronDir, dstElectronDir)
	ok("electron/ kopyalandı")

	// 8. ASAR'ı yeniden paketle
	repackAsar(tmpDir, asarPath, asarUnpacked)

	elapsed := time.Since(start).Round(time.Millisecond)
	fmt.Printf(colorBold+colorGreen+"\n✅ Tamamlandı! (%s)\n"+colorReset, elapsed)
	fmt.Println("   Anytype'ı yeniden başlatarak değişiklikleri görebilirsiniz.")
}

// ─────────────────────────────── Build ───────────────────────────────────────

func buildUI(repoRoot string) {
	info("UI derleniyor... (bu birkaç dakika sürebilir)")

	// Bun veya npm kullan
	pm := detectPackageManager(repoRoot)
	info("Paket yöneticisi: %s", pm)

	cmd := exec.Command(pm, "run", "build")
	cmd.Dir = repoRoot
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fatal("UI derlemesi başarısız: %v", err)
	}
	ok("UI derleme tamamlandı")
}

func detectPackageManager(repoRoot string) string {
	if fileExists(filepath.Join(repoRoot, "bun.lock")) {
		if _, err := exec.LookPath("bun"); err == nil {
			return "bun"
		}
	}
	return "npm"
}

// ─────────────────────────────── App yolu ────────────────────────────────────

func findAppResourcesDir(repoRoot string) string {
	if *flagAppPath != "" {
		return *flagAppPath
	}

	candidates := platformCandidates(repoRoot)
	for _, c := range candidates {
		verbose("Kontrol ediliyor: %s", c)
		if fileExists(filepath.Join(c, "app.asar")) {
			return c
		}
	}
	fatal("Kurulu Anytype bulunamadı. --app-path ile manuel belirtin.\nDenenen yollar:\n  %s",
		strings.Join(candidates, "\n  "))
	return ""
}

func platformCandidates(repoRoot string) []string {
	home, _ := os.UserHomeDir()

	switch runtime.GOOS {
	case "darwin":
		return []string{
			"/Applications/Anytype.app/Contents/Resources",
			filepath.Join(home, "Applications/Anytype.app/Contents/Resources"),
			// Nightly / alpha sürümleri
			"/Applications/Anytype Alpha.app/Contents/Resources",
			"/Applications/Anytype Beta.app/Contents/Resources",
		}
	case "linux":
		return []string{
			// AppImage mount edilmiş hali
			"/opt/Anytype/resources",
			"/usr/lib/anytype/resources",
			filepath.Join(home, ".local/lib/anytype/resources"),
			// Snap
			filepath.Join(home, "snap/anytype/current/resources"),
		}
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		programFiles := os.Getenv("ProgramFiles")
		return []string{
			filepath.Join(localAppData, "Programs", "anytype", "resources"),
			filepath.Join(programFiles, "Anytype", "resources"),
			filepath.Join(localAppData, "anytype", "resources"),
		}
	default:
		return nil
	}
}

// ─────────────────────────────── ASAR ────────────────────────────────────────

// extractAsar, npx asar extract <src> <tmpDir> komutunu çalıştırır.
func extractAsar(asarPath string) string {
	tmp, err := os.MkdirTemp("", "anytype-deploy-*")
	if err != nil {
		fatal("Geçici dizin oluşturulamadı: %v", err)
	}

	info("ASAR çözülüyor: %s", asarPath)
	if *flagDryRun {
		warn("dry-run: asar extract atlandı")
		return tmp
	}

	run("npx", "asar", "extract", asarPath, tmp)
	ok("ASAR çözüldü → %s", tmp)
	return tmp
}

// repackAsar, extract edilmiş dizinden yeni bir app.asar oluşturur.
// Mevcut ASAR yedeklenir (.asar.bak).
func repackAsar(srcDir, asarPath, unpackedDir string) {
	info("ASAR yeniden paketleniyor...")

	if *flagDryRun {
		warn("dry-run: asar pack atlandı")
		return
	}

	// Yedek
	backupPath := asarPath + ".bak"
	if err := copyFile(asarPath, backupPath); err != nil {
		warn("ASAR yedeği alınamadı: %v", err)
	} else {
		verbose("Yedek: %s", backupPath)
	}

	// Hangi klasörler unpacked kalmalı? Mevcut unpacked'ı tarayarak tespit et.
	unpackGlob := buildUnpackGlob(unpackedDir)

	args := []string{"asar", "pack", srcDir, asarPath}
	if unpackGlob != "" {
		args = append(args, "--unpack", unpackGlob)
	}
	run("npx", args...)
	ok("ASAR paketlendi → %s", asarPath)
}

// buildUnpackGlob, mevcut app.asar.unpacked içindeki dosyalardan
// {**/*.node,**/anytypeHelper,...} glob'u oluşturur.
func buildUnpackGlob(unpackedDir string) string {
	if !fileExists(unpackedDir) {
		return ""
	}

	extSet := map[string]bool{}
	nameSet := map[string]bool{}

	_ = filepath.WalkDir(unpackedDir, func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(p))
		name := filepath.Base(p)
		switch ext {
		case ".node", ".so", ".dylib", ".dll":
			extSet["**/*"+ext] = true
		}
		// Bilinen binary adları
		switch name {
		case "anytypeHelper", "anytypeHelper.exe", "nativeMessagingHost", "nativeMessagingHost.exe":
			nameSet["**/"+name] = true
		}
		return nil
	})

	parts := []string{}
	for k := range extSet {
		parts = append(parts, k)
	}
	for k := range nameSet {
		parts = append(parts, k)
	}
	if len(parts) == 0 {
		return ""
	}
	return "{" + strings.Join(parts, ",") + "}"
}

// ─────────────────────────────── Dosya yardımcıları ──────────────────────────

func mustCopyDir(src, dst string) {
	if *flagDryRun {
		warn("dry-run: kopyalanacak %s → %s", src, dst)
		return
	}
	if err := copyDir(src, dst); err != nil {
		fatal("Dizin kopyalanamadı %s → %s: %v", src, dst, err)
	}
}

func mustCopyFile(src, dst string) {
	if *flagDryRun {
		warn("dry-run: kopyalanacak %s → %s", src, dst)
		return
	}
	if err := copyFile(src, dst); err != nil {
		fatal("Dosya kopyalanamadı %s → %s: %v", src, dst, err)
	}
}

func copyDir(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		target := filepath.Join(dst, rel)

		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		verbose("  cp %s", rel)
		return copyFile(path, target)
	})
}

func copyFile(src, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	// İzinleri koru
	info2, err := os.Stat(src)
	if err == nil {
		_ = out.Chmod(info2.Mode())
	}
	return nil
}

func fileExists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

// ─────────────────────────────── Proje kökü ──────────────────────────────────

func mustRepoRoot() string {
	// Önce çalışma dizininden ve üst dizinlerinden dene
	wd, _ := os.Getwd()
	dir := wd
	for {
		if pkg := tryFindRoot(dir); pkg != "" {
			return pkg
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	// go run scripts/deploy.go şeklinde çalıştırılıyorsa, os.Args[0]'ın yakınından bak
	if len(os.Args) > 0 {
		src := os.Args[0]
		// kaynak dosyanın dizinine göre iki seviye yukarı dene
		for _, candidate := range []string{
			filepath.Dir(src),
			filepath.Join(filepath.Dir(src), ".."),
		} {
			abs, err := filepath.Abs(candidate)
			if err == nil {
				if pkg := tryFindRoot(abs); pkg != "" {
					return pkg
				}
			}
		}
	}

	fatal("Proje kök dizini bulunamadı (package.json aranamadı).\n" +
		"  Lütfen proje kök dizininden çalıştırın:\n" +
		"    go run scripts/deploy.go")
	return ""
}


func tryFindRoot(dir string) string {
	// Proje kökü: package.json ve electron/ dizini birlikte var mı?
	pkgJSON := filepath.Join(dir, "package.json")
	electronDir := filepath.Join(dir, "electron")
	if fileExists(pkgJSON) && fileExists(electronDir) {
		return dir
	}
	return ""
}


// ─────────────────────────────── Komut çalıştırıcı ───────────────────────────

func run(name string, args ...string) {
	verbose("$ %s %s", name, strings.Join(args, " "))
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fatal("Komut başarısız (%s %s): %v", name, strings.Join(args, " "), err)
	}
}
