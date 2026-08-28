//go:build ignore

// scripts/install.go — Step-by-step (Next-Next-Finish) interactive installation
// and deployment wizard for Windows, macOS, and Linux.
//
// Usage:
//   go run scripts/install.go
//
// or compile as a standalone binary:
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

// ─────────────────────────────── Colors & Console ────────────────────────────

const (
	colorReset   = "\033[0m"
	colorGreen   = "\033[32m"
	colorYellow  = "\033[33m"
	colorRed     = "\033[31m"
	colorCyan    = "\033[36m"
	colorBold    = "\033[1m"
	colorBlue    = "\033[34m"
	colorMagenta = "\033[35m"
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
	fmt.Printf("\n" + colorBold + colorCyan + "================================================================" + colorReset + "\n")
	fmt.Printf(colorBold+colorMagenta+" 🚀 ANYTYPE-TS INSTALLATION WIZARD (Next-Next-Finish)"+colorReset+"\n")
	fmt.Printf(colorBold+colorYellow+" [%d/%d] %s"+colorReset+"\n", stepNum, totalSteps, stepTitle)
	fmt.Printf(colorBold + colorCyan + "================================================================" + colorReset + "\n\n")
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
	defStr := "Y/n"
	if !defaultYes {
		defStr = "y/N"
	}
	defWord := "Yes"
	if !defaultYes {
		defWord = "No"
	}
	fmt.Printf(colorBold+colorGreen+"▶ %s "+colorYellow+"(%s) [Enter = %s]: "+colorReset, question, defStr, defWord)

	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(strings.ToLower(input))
	if input == "" {
		return defaultYes
	}
	return input == "y" || input == "yes" || input == "e" || input == "evet"
}

// ─────────────────────────────── Main Wizard ─────────────────────────────────

func main() {
	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Printf(colorRed+"[ERROR] Project root directory not found: %v\n"+colorReset, err)
		os.Exit(1)
	}

	clearConsole()
	printHeader("Welcome & Installation Detection", 1, 5)
	fmt.Println("This wizard will build and hot-deploy the latest Anytype UI")
	fmt.Println("and background services directly into your installed Anytype app.")
	fmt.Printf("Platform: %s (%s)\n\n", runtime.GOOS, runtime.GOARCH)

	// STEP 1: Detect installed Anytype directory
	detectedDir := findInstalledResourcesDir()
	var targetResourcesDir string

	if detectedDir != "" {
		fmt.Printf(colorGreen+"[✓] Found installed Anytype directory:\n    %s\n\n"+colorReset, detectedDir)
		if askYesNo("Install to this location?", true) {
			targetResourcesDir = detectedDir
		} else {
			targetResourcesDir = askPrompt("Please enter Anytype 'resources' directory path", "")
		}
	} else {
		fmt.Println(colorYellow + "[!] Installed Anytype directory was not found automatically." + colorReset)
		targetResourcesDir = askPrompt("Please enter Anytype 'resources' directory path", "")
	}

	if targetResourcesDir == "" || !dirExists(targetResourcesDir) {
		fmt.Printf(colorRed+"\n[ERROR] Specified directory does not exist: %s\n"+colorReset, targetResourcesDir)
		os.Exit(1)
	}

	// STEP 2: Process check & graceful termination
	printHeader("Running Application Check", 2, 5)
	if isProcessRunning("Anytype") || isProcessRunning("anytype") {
		fmt.Println(colorYellow + "[!] Anytype is currently running in the background." + colorReset)
		fmt.Println("To prevent file access conflicts, Anytype needs to be closed.")
		fmt.Println()
		if askYesNo("Automatically close Anytype now?", true) {
			killProcess("Anytype")
			time.Sleep(1 * time.Second)
			fmt.Println(colorGreen + "[✓] Anytype closed successfully." + colorReset)
		} else {
			fmt.Println(colorYellow + "[!] Please close Anytype manually and press [Enter] to continue..." + colorReset)
			_, _ = reader.ReadString('\n')
		}
	} else {
		fmt.Println(colorGreen + "[✓] Anytype is not running, ready to proceed." + colorReset)
	}

	// STEP 3: UI Build Option
	printHeader("UI Build Selection", 3, 5)
	hasDist := dirExists(filepath.Join(repoRoot, "dist"))
	var doBuild bool

	if hasDist {
		fmt.Println("Pre-existing 'dist/' build directory detected.")
		fmt.Println("  [1] Rebuild from source (Recommended / Latest code)")
		fmt.Println("  [2] Use existing build (Fast deploy)")
		fmt.Println()
		choice := askPrompt("Your choice", "1")
		doBuild = (choice == "1")
	} else {
		fmt.Println(colorYellow + "'dist/' directory not found. Building is required." + colorReset)
		doBuild = true
	}

	if doBuild {
		fmt.Printf("\n" + colorCyan + "▶ Building UI (bun run build)... Please wait...\n" + colorReset)
		if err := executeBuild(repoRoot); err != nil {
			fmt.Printf(colorRed+"\n[ERROR] Build failed: %v\n"+colorReset, err)
			os.Exit(1)
		}
		fmt.Println(colorGreen + "\n[✓] UI build completed successfully!" + colorReset)
	}

	// STEP 4: Backup, Extraction & ASAR Deployment
	printHeader("Installation & Packaging", 4, 5)
	fmt.Printf("Target: %s\n\n", targetResourcesDir)

	asarPath := filepath.Join(targetResourcesDir, "app.asar")
	asarUnpacked := filepath.Join(targetResourcesDir, "app.asar.unpacked")

	if !fileExists(asarPath) {
		fmt.Printf(colorRed+"[ERROR] %s was not found!\n"+colorReset, asarPath)
		os.Exit(1)
	}

	// Create backup
	backupPath := asarPath + fmt.Sprintf(".backup_%d", time.Now().Unix())
	fmt.Printf(colorCyan+"[1/4] Backing up original app.asar... (%s)\n"+colorReset, filepath.Base(backupPath))
	if err := copyFile(asarPath, backupPath); err != nil {
		fmt.Printf(colorYellow+"[WARN] Failed to create backup: %v\n"+colorReset, err)
	} else {
		fmt.Println(colorGreen + "[✓] Safe backup created." + colorReset)
	}

	// Extract ASAR
	fmt.Println(colorCyan + "[2/4] Extracting ASAR archive..." + colorReset)
	tmpExtractDir, err := os.MkdirTemp("", "anytype-install-*")
	if err != nil {
		fmt.Printf(colorRed+"[ERROR] Failed to create temporary directory: %v\n"+colorReset, err)
		os.Exit(1)
	}
	defer os.RemoveAll(tmpExtractDir)

	if err := runCmd("npx", "-y", "asar", "extract", asarPath, tmpExtractDir); err != nil {
		fmt.Printf(colorRed+"[ERROR] Failed to extract ASAR: %v\n"+colorReset, err)
		os.Exit(1)
	}

	// Inject updated files
	fmt.Println(colorCyan + "[3/4] Copying updated dist/, electron.js, and configuration files..." + colorReset)
	_ = copyDir(filepath.Join(repoRoot, "dist"), filepath.Join(tmpExtractDir, "dist"))
	_ = copyFile(filepath.Join(repoRoot, "electron.js"), filepath.Join(tmpExtractDir, "electron.js"))
	_ = copyDir(filepath.Join(repoRoot, "electron"), filepath.Join(tmpExtractDir, "electron"))

	// Repack ASAR
	fmt.Println(colorCyan + "[4/4] Repacking ASAR archive..." + colorReset)
	tmpNewAsar := filepath.Join(os.TempDir(), fmt.Sprintf("new-app-%d.asar", time.Now().UnixNano()))
	defer os.Remove(tmpNewAsar)

	packArgs := []string{"-y", "asar", "pack", tmpExtractDir, tmpNewAsar}
	unpackGlob := buildUnpackGlob(asarUnpacked)
	if unpackGlob != "" {
		packArgs = append(packArgs, "--unpack", unpackGlob)
	}

	if err := runCmd("npx", packArgs...); err != nil {
		fmt.Printf(colorRed+"[ERROR] Failed to pack ASAR: %v\n"+colorReset, err)
		os.Exit(1)
	}

	// Replace active ASAR
	_ = os.Remove(asarPath)
	if err := copyFile(tmpNewAsar, asarPath); err != nil {
		fmt.Printf(colorRed+"[ERROR] Failed to write new app.asar: %v\n"+colorReset, err)
		os.Exit(1)
	}
	fmt.Println(colorGreen + "[✓] Updated version successfully applied to installed Anytype!" + colorReset)

	// STEP 5: Completion & Launch (Finish)
	printHeader("Congratulations! Installation Complete", 5, 5)
	fmt.Println(colorBold + colorGreen + "🎉 ALL UPDATES HAVE BEEN INSTALLED SUCCESSFULLY!" + colorReset)
	fmt.Println("\nInstalled Highlights:")
	fmt.Println("  ✔ P2P Network Configuration (config.json, static-peers.json, own-addresses.json)")
	fmt.Println("  ✔ Live Socket & Peer Connectivity Testing (Yamux, QUIC, TCP, WebSocket)")
	fmt.Println("  ✔ 12-Hour Auto-Eviction & Ultra Fast Image Caching Engine")
	fmt.Println("  ✔ Circular Space Icons & Round Selection Outline Sidebar Design")
	fmt.Println("  ✔ Theme & Typography Customizer (Volume Sliders, System Fonts Listing)")
	fmt.Println()

	if askYesNo("Launch Anytype now?", true) {
		launchInstalledAnytype(targetResourcesDir)
	}

	fmt.Println(colorBold + colorCyan + "\nInstallation Wizard complete. Press [Enter] to exit..." + colorReset)
	_, _ = reader.ReadString('\n')
}

// ─────────────────────────────── Helper Functions ────────────────────────────

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
	return "", fmt.Errorf("package.json not found")
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
			fmt.Println(colorGreen + "[✓] Anytype launched." + colorReset)
		}
	case "darwin":
		_ = exec.Command("open", "-a", "Anytype").Start()
		fmt.Println(colorGreen + "[✓] Anytype launched." + colorReset)
	case "linux":
		_ = exec.Command("anytype").Start()
		fmt.Println(colorGreen + "[✓] Anytype launched." + colorReset)
	}
}

func ensureBun(repoRoot string) (string, error) {
	// 1. Check PATH
	if p, err := exec.LookPath("bun"); err == nil {
		return p, nil
	}
	if p, err := exec.LookPath("bun.exe"); err == nil {
		return p, nil
	}

	// 2. Check default installation directories
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

	// 3. Missing — Prompt user to automatically download and install
	fmt.Printf(colorYellow + "\n[!] 'bun' package manager was not found on your system.\n" + colorReset)
	fmt.Println("Bun is required to build the Anytype interface.")
	if !askYesNo("Automatically download and install Bun?", true) {
		return "", fmt.Errorf("bun installation was cancelled by the user")
	}

	fmt.Println(colorCyan + "\n▶ Downloading and installing Bun..." + colorReset)

	if runtime.GOOS == "windows" {
		cmd := exec.Command("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm bun.sh/install.ps1 | iex")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("powershell bun installation failed: %v", err)
		}
	} else {
		cmd := exec.Command("bash", "-c", "curl -fsSL https://bun.sh/install | bash")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("curl bun installation failed: %v", err)
		}
	}

	// Check installation paths again
	for _, c := range candidates {
		if fileExists(c) {
			dir := filepath.Dir(c)
			_ = os.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
			fmt.Printf(colorGreen+"[✓] Bun successfully installed: %s\n"+colorReset, c)
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

	// If node_modules does not exist, run bun install first
	nodeModules := filepath.Join(repoRoot, "node_modules")
	if !dirExists(nodeModules) {
		fmt.Println(colorCyan + "▶ Installing required dependencies (bun install)..." + colorReset)
		cmdInstall := exec.Command(bunPath, "install")
		cmdInstall.Dir = repoRoot
		cmdInstall.Stdout = os.Stdout
		cmdInstall.Stderr = os.Stderr
		if err := cmdInstall.Run(); err != nil {
			return fmt.Errorf("bun install failed: %v", err)
		}
		fmt.Println(colorGreen + "[✓] Dependencies installed.\n" + colorReset)
	}

	fmt.Printf(colorCyan+"▶ Building UI (%s run build)...\n"+colorReset, bunPath)
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
