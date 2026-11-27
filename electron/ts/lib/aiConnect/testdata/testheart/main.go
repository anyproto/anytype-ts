// Command testheart is the throwaway heart of anytype-ts' forwarder integration test
// (electron/ts/lib/aiConnect/forwarder.integration.test.ts). It is heart's cmd/evalheart plus the two things
// that test needs from the account's own session: the hash of the key it was given, and RevokeApp.
//
// It is built inside an anytype-heart checkout without adding a file to it:
//
//	go build -overlay <overlay.json> -o <out> ./cmd/anytype-ts-testheart
//
// where the overlay maps <heart>/cmd/anytype-ts-testheart/main.go to this file.
//
// stdout: one JSON line {api_url, api_key, app_hash, account_id}; then one line per stdin command
// "revoke <hash>": {"revoked": "<hash>", "code": <error code, 0 = ok>}. Closing stdin tears the heart down
// and deletes its data directory.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/anyproto/anytype-heart/cmd/apiv2eval/heartboot"
	"github.com/anyproto/anytype-heart/pb"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "testheart:", err)
		os.Exit(1)
	}
}

func run() error {
	binary := flag.String("heart-binary", "", "a prebuilt cmd/grpcserver")
	flag.Parse()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()
	heart, err := heartboot.Start(ctx, heartboot.Options{BinaryPath: *binary, AccountName: "anytype-ts", AppName: "anytype-ts-integration", Log: os.Stderr})
	if err != nil {
		return fmt.Errorf("start heart: %w", err)
	}
	defer func() { _ = heart.Stop() }()

	client := heart.GRPCClient()
	apps, err := client.AccountLocalLinkListApps(heart.GRPCContext(ctx), &pb.RpcAccountLocalLinkListAppsRequest{})
	if err != nil {
		return fmt.Errorf("list apps: %w", err)
	}
	hash := ""
	for _, app := range apps.GetApp() {
		if app.GetAppKey() == heart.APIKey {
			hash = app.GetAppHash()
		}
	}
	if hash == "" {
		return fmt.Errorf("the key's grant is not in the app list")
	}
	line, _ := json.Marshal(map[string]string{"api_url": heart.APIURL, "api_key": heart.APIKey, "app_hash": hash, "account_id": heart.AccountId})
	fmt.Println(string(line))

	lines := make(chan string)
	go func() {
		defer close(lines)
		sc := bufio.NewScanner(os.Stdin)
		for sc.Scan() {
			lines <- sc.Text()
		}
	}()
	for {
		select {
		case <-ctx.Done():
			return nil
		case text, ok := <-lines:
			if !ok {
				return nil
			}
			if h, found := strings.CutPrefix(text, "revoke "); found {
				code := -1
				resp, err := client.AccountLocalLinkRevokeApp(heart.GRPCContext(ctx), &pb.RpcAccountLocalLinkRevokeAppRequest{AppHash: strings.TrimSpace(h)})
				if err == nil {
					code = int(resp.GetError().GetCode())
				}
				out, _ := json.Marshal(map[string]any{"revoked": strings.TrimSpace(h), "code": code})
				fmt.Println(string(out))
			}
		}
	}
}
