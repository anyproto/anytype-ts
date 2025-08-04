# nix-ld should be enabled in configuration.nix:
# programs.nix-ld.enable = true;
# programs.nix-ld.libraries = with pkgs; [
#   gtk3
#   # Add any missing dynamic libraries for unpackaged programs
#   # here, NOT in environment.systemPackages
# ];

{
  description = "";
  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.0.tar.gz";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        config = { allowUnfree = true; };
      };
      deps = with pkgs; [
        appimage-run
        # commit hook
        husky
        gitleaks
        # build deps
        libxcrypt
        libsecret
        pkg-config
        jq
        nodejs_22

        # keytar build fails on npm install because python312 has distutils removed
        python311

        # electron binary launch deps.
        # see also https://nix.dev/guides/faq#how-to-run-non-nix-executables
        glib
        nss
        nspr
        dbus
        atk
        cups
        libdrm
        gtk3
        adwaita-icon-theme
        pango
        cairo
        xorg.libX11
        xorg.libX11
        xorg.libXcomposite
        xorg.libXdamage
        xorg.libXext
        xorg.libXfixes
        xorg.libXrandr
        mesa
        expat
        libxkbcommon
        xorg.libxcb
        alsa-lib
        libGL
        gdk-pixbuf
        libgbm
      ];
      XDG_ICONS_PATH = "${pkgs.hicolor-icon-theme}/share:${pkgs.adwaita-icon-theme}/share";
    in {
      devShell = pkgs.mkShell {
        name = "anytype-ts-dev";
        SERVER_PORT = 8080;
        # ANY_SYNC_NETWORK = "/home/zarkone/anytype/local-network-config.yml";
        LD_LIBRARY_PATH = "${pkgs.lib.strings.makeLibraryPath deps}";
        nativeBuildInputs = deps;
        shellHook = ''
          # fixes "No GSettings schemas" error
          export XDG_DATA_DIRS=$GSETTINGS_SCHEMAS_PATH:$XDG_ICONS_PATH:$XDG_DATA_DIRS
        '';
      };

    });
}
