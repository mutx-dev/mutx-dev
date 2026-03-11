using DocForge.TemplateDriven;
using DocForge.Templates;

if (args.Length == 0)
{
    PrintUsage();
    return 1;
}

var mode = args[0].ToLowerInvariant();

try
{
    return mode switch
    {
        "tech" => RunPresetTemplate("tech", args),
        "academic" => RunPresetTemplate("academic", args),
        "from-template" => RunFromTemplate(args),
        _ => UnknownMode(mode),
    };
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Generation failed: {ex.Message}");
    return 1;
}

int RunPresetTemplate(string preset, string[] cliArgs)
{
    if (cliArgs.Length < 2)
    {
        Console.Error.WriteLine($"Usage: dotnet run {preset} <output-path> [asset-dir]");
        return 1;
    }

    var outputPath = cliArgs[1];
    var assetDir = cliArgs.Length > 2 ? cliArgs[2] : ".";

    if (LooksLikeDocxTemplatePath(assetDir))
    {
        Console.Error.WriteLine("User template detected in arguments.");
        Console.Error.WriteLine("Do not apply preset formats to template-based tasks.");
        Console.Error.WriteLine("Use: dotnet run from-template <template.docx> <output-path>");
        return 1;
    }

    switch (preset)
    {
        case "tech":
            TechManual.Build(outputPath, assetDir);
            Console.WriteLine($"Generated technical manual: {outputPath}");
            break;
        case "academic":
            AcademicPaper.Build(outputPath, assetDir);
            Console.WriteLine($"Generated academic paper: {outputPath}");
            break;
    }

    return 0;
}

int RunFromTemplate(string[] cliArgs)
{
    if (cliArgs.Length < 3)
    {
        Console.Error.WriteLine("Usage: dotnet run from-template <template.docx> <output-path>");
        return 1;
    }

    var templatePath = cliArgs[1];
    var outputPath = cliArgs[2];

    var profile = TemplateAssembler.BuildFromTemplate(templatePath, outputPath);
    Console.WriteLine($"Generated from user template: {outputPath}");
    Console.WriteLine($"Template profile: {profile.Summary}");

    return 0;
}

int UnknownMode(string modeName)
{
    Console.Error.WriteLine($"Unknown mode: {modeName}");
    PrintUsage();
    return 1;
}

void PrintUsage()
{
    Console.WriteLine("DocForge - Document Generation Tool");
    Console.WriteLine();
    Console.WriteLine("Usage:");
    Console.WriteLine("  dotnet run tech <output-path> [asset-dir]");
    Console.WriteLine("  dotnet run academic <output-path> [asset-dir]");
    Console.WriteLine("  dotnet run from-template <template.docx> <output-path>");
    Console.WriteLine();
    Console.WriteLine("Rules:");
    Console.WriteLine("  - If user provides a .docx template, use from-template mode.");
    Console.WriteLine("  - Do not run tech/academic presets on template-based tasks.");
}

bool LooksLikeDocxTemplatePath(string path)
{
    return File.Exists(path) &&
           Path.GetExtension(path).Equals(".docx", StringComparison.OrdinalIgnoreCase);
}
