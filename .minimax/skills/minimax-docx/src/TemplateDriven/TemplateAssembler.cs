using DocumentFormat.OpenXml.Packaging;
using DocForge.Core;

namespace DocForge.TemplateDriven;

public static class TemplateAssembler
{
    public static TemplateProfile BuildFromTemplate(
        string templatePath,
        string outputPath,
        Action<WordprocessingDocument, TemplateProfile>? compose = null)
    {
        if (!File.Exists(templatePath))
        {
            throw new FileNotFoundException($"Template not found: {templatePath}");
        }

        var destination = Path.GetFullPath(outputPath);
        var destinationDir = Path.GetDirectoryName(destination);
        if (!string.IsNullOrEmpty(destinationDir))
        {
            Directory.CreateDirectory(destinationDir);
        }

        File.Copy(templatePath, destination, overwrite: true);

        using var doc = WordprocessingDocument.Open(destination, true);
        var profile = TemplateAnalyzer.Analyze(doc);

        compose?.Invoke(doc, profile);

        if (doc.MainDocumentPart is not null)
        {
            Fields.EnableAutoRefresh(doc.MainDocumentPart);
            doc.MainDocumentPart.Document?.Save();
        }

        return profile;
    }
}
