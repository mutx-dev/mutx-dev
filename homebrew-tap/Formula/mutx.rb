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
    venv = libexec/"venv"
    system "python3.12", "-m", "venv", venv
    system venv/"bin"/"pip", "install", "--no-cache-dir", "git+https://github.com/mutx-dev/mutx-dev.git@cli-v#{version}"
    bin.install_symlink venv/"bin"/"mutx"
  end

  test do
    output = shell_output("#{bin}/mutx status")
    assert_match "API URL:", output
    assert_match "Status:", output
  end
end
