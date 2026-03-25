class Mutx < Formula
  desc "Operator CLI and Textual TUI for the MUTX control plane"
  homepage "https://mutx.dev"
  license "MIT"
  version "1.2.0"

  on_macos do
    on_arm do
      url "https://github.com/mutx-dev/mutx-dev/archive/refs/tags/cli-v1.2.0.tar.gz"
      sha256 "39cbf66ed9d66bda6beed2042ce33b6d82f0e9c8228341a5cbaab6a3f97e1b92"
    end

    on_intel do
      url "https://github.com/mutx-dev/mutx-dev/archive/refs/tags/cli-v1.2.0.tar.gz"
      sha256 "39cbf66ed9d66bda6beed2042ce33b6d82f0e9c8228341a5cbaab6a3f97e1b92"
    end
  end

  depends_on "python@3.12"

  def install
    python = Formula["python@3.12"].opt_bin/"python3.12"
    venv = libexec/"venv"

    system python, "-m", "venv", venv

    ipv4_env = { "RES_OPTIONS" => "ipv4", "GIT_TERMINAL_PROMPT" => "0" }

    with_env(ipv4_env) do
      system venv/"bin/pip", "install",
             "--disable-pip-version-check",
             "--no-cache-dir",
             "--upgrade",
             "pip",
             "setuptools",
             "wheel"
      system venv/"bin/pip", "install",
             "--disable-pip-version-check",
             "--no-cache-dir",
             buildpath
    end

    bin.install_symlink venv/"bin/mutx"
  end

  test do
    output = shell_output("#{bin}/mutx status 2>&1", 0)
    assert_match "API URL:", output
  end
end
