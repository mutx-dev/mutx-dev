using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace DocForge.TemplateDriven;

public static class TemplateAnalyzer
{
    private static readonly string[] SignatureKeywords =
    [
        "signature",
        "sign",
        "authorized",
        "签名",
        "签字",
        "签署",
        "盖章",
    ];

    public static TemplateProfile Analyze(string templatePath)
    {
        using var doc = WordprocessingDocument.Open(templatePath, false);
        return Analyze(doc);
    }

    public static TemplateProfile Analyze(WordprocessingDocument doc)
    {
        var main = doc.MainDocumentPart
            ?? throw new InvalidOperationException("Template has no MainDocumentPart.");

        var body = main.Document?.Body
            ?? throw new InvalidOperationException("Template has no document body.");

        var paragraphs = body.Descendants<Paragraph>().Count();
        var tables = body.Descendants<Table>().Count();
        var bookmarks = body.Descendants<BookmarkStart>().Count();
        var pageBreaks = body.Descendants<Break>().Count(b => b.Type?.Value == BreakValues.Page);

        var sectionCount = body.Descendants<SectionProperties>().Count();
        if (sectionCount == 0)
        {
            sectionCount = 1;
        }

        var hasToc = body.Descendants<SimpleField>()
            .Any(field => field.Instruction?.Value?.Contains("TOC", StringComparison.OrdinalIgnoreCase) == true);

        var hasHeader = main.HeaderParts.Any();
        var hasFooter = main.FooterParts.Any();

        var hasTitlePage = body.Descendants<TitlePage>().Any();
        if (!hasTitlePage && main.DocumentSettingsPart?.Settings is not null)
        {
            hasTitlePage = main.DocumentSettingsPart.Settings.Descendants<TitlePage>().Any();
        }

        var allText = string.Join(
            "\n",
            body.Descendants<Text>().Select(t => t.Text ?? string.Empty)
        ).ToLowerInvariant();

        var hasSignatureCue = SignatureKeywords.Any(allText.Contains);

        return new TemplateProfile(
            SectionCount: sectionCount,
            ParagraphCount: paragraphs,
            TableCount: tables,
            BookmarkCount: bookmarks,
            PageBreakCount: pageBreaks,
            HasTocField: hasToc,
            HasHeader: hasHeader,
            HasFooter: hasFooter,
            HasTitlePageSetting: hasTitlePage,
            HasSignatureCue: hasSignatureCue
        );
    }
}
