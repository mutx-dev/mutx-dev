class Mutx < Formula
  desc "Operator CLI and Textual TUI for the MUTX control plane"
  homepage "https://mutx.dev"
  license "MIT"
  version "1.2.0"

  on_macos do
    on_arm do
      url "https://github.com/mutx-dev/mutx-dev/archive/refs/tags/cli-v1.2.0.tar.gz"
      sha256 "b6fc16a429d1d5c48cfeb252a9503faba69fc6a49673b74815a3e940d5fddba2"
    end
    on_intel do
      url "https://github.com/mutx-dev/mutx-dev/archive/refs/tags/cli-v1.2.0.tar.gz"
      sha256 "b6fc16a429d1d5c48cfeb252a9503faba69fc6a49673b74815a3e940d5fddba2"
    end
  end

  depends_on "python@3.12"

  def install
    ENV.prepend_path "PATH", "#{Formula["python@3.12"].opt_bin}:#{ENV["PATH"]}"

    system "python3.12", "-m", "pip", "install", "--no-cache-dir",
           "--prefix=#{prefix}",
           "git+https://github.com/mutx-dev/mutx-dev.git@v#{version}"

    bin.install_symlink "#{prefix}/bin/mutx"
  end

  test do
    output = shell_output("#{bin}/mutx status")
    assert_match "API URL:", output
    assert_match "Status:", output
  end
end
