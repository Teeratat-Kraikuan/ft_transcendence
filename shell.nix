let
  pkgs = import <nixpkgs> {};
in 

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    pipenv
    which
    gcc
    binutils
    stdenv.cc.cc

    postgresql

    # # All the C libraries that a manylinux_1 wheel might depend on:
    # ncurses
    # xorg.libX11
    # xorg.libXext
    # xorg.libXrender
    # xorg.libICE
    # xorg.libSM
    # glib
  ];
  shellHook = ''
    pipenv install
    export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib";
  '';
}
