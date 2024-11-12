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
      deps = [
        pkgs.appimage-run
        # commit hook
        pkgs.husky
        # build deps
        pkgs.libxcrypt
        pkgs.libsecret
        pkgs.pkg-config
        pkgs.jq
        pkgs.nodejs_22

        # keytar build fails on npm install because python312 has distutils removed
        pkgs.python311

        # electron binary launch deps.
        # see also https://nix.dev/guides/faq#how-to-run-non-nix-executables
        pkgs.glib
        pkgs.nss
        pkgs.nspr
        pkgs.dbus
        pkgs.atk
        pkgs.cups
        pkgs.libdrm
        pkgs.gtk3
        pkgs.adwaita-icon-theme
        pkgs.pango
        pkgs.cairo
        pkgs.xorg.libX11
        pkgs.xorg.libX11
        pkgs.xorg.libXcomposite
        pkgs.xorg.libXdamage
        pkgs.xorg.libXext
        pkgs.xorg.libXfixes
        pkgs.xorg.libXrandr
        pkgs.mesa
        pkgs.expat
        pkgs.libxkbcommon
        pkgs.xorg.libxcb
        pkgs.alsa-lib
        pkgs.libGL
        pkgs.gdk-pixbuf
      ];
      XDG_ICONS_PATH = "${pkgs.hicolor-icon-theme}/share:${pkgs.adwaita-icon-theme}/share";
    in {
      devShell = pkgs.mkShell {
        name = "anytype-ts-dev";
        SERVER_PORT = 9090;
        ANY_SYNC_NETWORK = "/home/zarkone/anytype/local-network-config.yml";
        LD_LIBRARY_PATH = "${pkgs.lib.strings.makeLibraryPath deps}";
        nativeBuildInputs = deps;
        shellHook = ''
          # fixes "No GSettings schemas" error
          export XDG_DATA_DIRS=$GSETTINGS_SCHEMAS_PATH:$XDG_ICONS_PATH:$XDG_DATA_DIRS
        '';
      };

    });
}
