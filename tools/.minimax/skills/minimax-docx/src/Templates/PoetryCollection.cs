// PoetryCollection.cs - Template demonstrating section management and page flow control
// USE CASE: Poetry books, essay collections, documents with cover pages on small paper (A5/B5)
// KEY PATTERNS:
//   - Cover page as isolated section (prevents overflow)
//   - Proper outline levels for TOC hierarchy
//   - Header/footer with page numbers
//   - Background image integration

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocForge.Core;

namespace DocForge.Templates;

public static class PoetryCollection
{
    private static readonly Themes.ColorSet Theme = Themes.Ink;

    // Page dimensions for A5
    private const uint A5Width = 8391;   // twips
    private const uint A5Height = 11906; // twips

    public static void Build(string outputPath, string assetDir)
    {
        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var main = doc.AddMainDocumentPart();
        main.Document = new Document(new Body());
        var body = main.Document.Body!;

        // === PATTERN: Create header/footer parts BEFORE adding content ===
        var (defaultHeaderId, defaultFooterId) = CreateHeaderFooter(main, "詩集");

        var coverRel = TryEmbed(main, Path.Combine(assetDir, "cover.png"));

        // === SECTION 1: Cover page (isolated section) ===
        RenderCoverPage(body, coverRel);
        EndSection(body, firstPageDifferent: true);  // Cover ends here, no overflow possible

        // === SECTION 2: Table of Contents ===
        RenderTocPage(body);
        EndSection(body, firstPageDifferent: false);

        // === SECTION 3: Preface - OutlineLevel 0 (Level 1 heading) ===
        RenderPreface(body);

        // === SECTION 4: Poetry chapters ===
        // PATTERN: Category headings are Level 1, poem titles are Level 2
        RenderChapter(body, "五言古詩", [
            ("靜夜思", "床前明月光，疑是地上霜。\n舉頭望明月，低頭思故鄉。"),
            ("春曉", "春眠不覺曉，處處聞啼鳥。\n夜來風雨聲，花落知多少。"),
        ]);

        RenderChapter(body, "七言律詩", [
            ("登高", "風急天高猿嘯哀，渚清沙白鳥飛回。\n無邊落木蕭蕭下，不盡長江滾滾來。"),
        ]);

        // === Final section properties (applied to last section) ===
        AppendFinalSectionProps(body, defaultHeaderId, defaultFooterId);

        Fields.EnableAutoRefresh(main);
        main.Document.Save();
    }

    // ============================================================
    // PATTERN: Header and Footer Creation
    // ============================================================
    private static (string headerId, string footerId) CreateHeaderFooter(MainDocumentPart main, string title)
    {
        // Create header part
        var headerPart = main.AddNewPart<HeaderPart>();
        headerPart.Header = new Header(
            new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    Primitives.TextStyle("SimSun", "SimSun", 9, Theme.Muted),
                    new Text(title)
                )
            )
        );
        headerPart.Header.Save();

        // Create footer part with page number
        var footerPart = main.AddNewPart<FooterPart>();
        footerPart.Footer = new Footer(
            new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    Primitives.TextStyle("SimSun", "SimSun", 9, Theme.Muted),
                    Fields.CurrentPage()
                )
            )
        );
        footerPart.Footer.Save();

        return (main.GetIdOfPart(headerPart), main.GetIdOfPart(footerPart));
    }

    // ============================================================
    // PATTERN: Section Break (prevents content overflow between sections)
    // ============================================================
    private static void EndSection(Body body, bool firstPageDifferent)
    {
        var sectPr = new SectionProperties(
            new SectionType { Val = SectionMarkValues.NextPage },
            new PageSize { Width = A5Width, Height = A5Height },
            new PageMargin
            {
                Top = 1134,    // ~1 inch
                Right = 1134,
                Bottom = 1134,
                Left = 1134,
                Header = 720,
                Footer = 720
            }
        );

        if (firstPageDifferent)
        {
            sectPr.Append(new TitlePage());  // First page has no header/footer
        }

        body.Append(new Paragraph(new ParagraphProperties(sectPr)));
    }

    private static void AppendFinalSectionProps(Body body, string headerId, string footerId)
    {
        // Final sectPr goes directly in body (not in a paragraph)
        body.Append(new SectionProperties(
            new PageSize { Width = A5Width, Height = A5Height },
            new PageMargin
            {
                Top = 1134,
                Right = 1134,
                Bottom = 1134,
                Left = 1134,
                Header = 720,
                Footer = 720
            },
            new HeaderReference { Type = HeaderFooterValues.Default, Id = headerId },
            new FooterReference { Type = HeaderFooterValues.Default, Id = footerId }
        ));
    }

    // ============================================================
    // PATTERN: Cover Page (minimal content, section-isolated)
    // ============================================================
    private static void RenderCoverPage(Body body, string? coverRel)
    {
        if (coverRel is not null)
        {
            body.Append(new Paragraph(new Run(
                Media.AnchoredBackdrop(coverRel, 100, "Cover", Metrics.A5WidthEmu, Metrics.A5HeightEmu)
            )));
        }

        // Vertical spacing - keep minimal for A5
        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(80, 0))));

        // Title
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                Primitives.Gaps(0, 12)
            ),
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 28, Theme.Heading, true),
                new Text("唐詩三百首")
            )
        ));

        // Subtitle
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 12, Theme.Muted),
                new Text("精選本")
            )
        ));

        // Note: Section break follows via EndSection() - content CANNOT overflow
    }

    private static void RenderTocPage(Body body)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(0, 14)),
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 18, Theme.Heading, true),
                new Text("目錄")
            )
        ));

        body.Append(new Paragraph(Fields.TableOfContents(1, 2)));
    }

    // ============================================================
    // PATTERN: Outline Levels for Correct TOC Hierarchy
    // ============================================================
    private static void RenderPreface(Body body)
    {
        // "序" is OutlineLevel 0 (appears as Level 1 in TOC)
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", outlineLevel: 0),  // <-- Level 1
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 16, Theme.Heading, true),
                new Text("序")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(8, 8)),
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 11, Theme.Body),
                new Text("唐詩三百首，蘅塘退士所編...")
            )
        ));
    }

    private static void RenderChapter(Body body, string categoryTitle, (string title, string content)[] poems)
    {
        // Category heading: OutlineLevel 0 (Level 1 in TOC)
        // This BREAKS the "序" hierarchy - poems under this category are NOT under "序"
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", outlineLevel: 0),  // <-- Level 1 (same as 序)
            new Run(
                Primitives.TextStyle("SimSun", "SimSun", 16, Theme.Heading, true),
                new Text(categoryTitle)
            )
        ));

        foreach (var (title, content) in poems)
        {
            // Poem title: OutlineLevel 1 (Level 2 in TOC, nested under category)
            body.Append(new Paragraph(
                Primitives.BlockStyle("Heading2", outlineLevel: 1),  // <-- Level 2
                new Run(
                    Primitives.TextStyle("SimSun", "SimSun", 14, Theme.Heading, true),
                    new Text(title)
                )
            ));

            // Poem content
            foreach (var line in content.Split('\n'))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(
                        new Justification { Val = JustificationValues.Center },
                        Primitives.Gaps(4, 4)
                    ),
                    new Run(
                        Primitives.TextStyle("SimSun", "SimSun", 11, Theme.Body),
                        new Text(line)
                    )
                ));
            }
        }
    }

    private static string? TryEmbed(MainDocumentPart main, string path)
    {
        return File.Exists(path) ? Media.EmbedImage(main, path) : null;
    }
}
