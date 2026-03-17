using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocForge.Core;

namespace DocForge.Templates;

public static class AcademicPaper
{
    private sealed record SectionPlan(int BookmarkId, string Bookmark, string Heading, string[] Paragraphs);

    private static readonly Themes.ColorSet Theme = Themes.Ocean;

    private static readonly SectionPlan[] NarrativeSections =
    [
        new(
            10,
            "Introduction",
            "1. Introduction",
            [
                "Large language models have shifted NLP development from task-specific pipelines toward unified foundation architectures, changing both cost structures and iteration speed.",
                "Despite rapid adoption, organizations still face a gap between benchmark gains and production reliability, especially under distribution drift and strict latency budgets."
            ]
        ),
        new(
            20,
            "Method",
            "2. Method and Evaluation Design",
            [
                "The study compares three deployment paths: full-size transformer serving, distilled model serving, and retrieval-augmented generation with compact decoders.",
                "Each path is evaluated on semantic quality, response delay, and operational load under controlled replay traffic."
            ]
        ),
        new(
            30,
            "Discussion",
            "4. Discussion",
            [
                "Quality improvements are not uniformly distributed across query categories; long-context reasoning benefits most, while short factual queries show smaller gains.",
                "Model strategy should therefore be tied to traffic composition rather than selected from aggregate scores alone."
            ]
        ),
        new(
            40,
            "Conclusion",
            "5. Conclusion",
            [
                "A practical rollout should prioritize predictable latency and controlled failure modes before maximizing absolute benchmark scores.",
                "Future work can extend this framework with domain adaptation and uncertainty-aware routing policies."
            ]
        ),
    ];

    private static readonly string[] References =
    [
        "[1] Brown et al. Language Models are Few-Shot Learners. NeurIPS, 2020.",
        "[2] Vaswani et al. Attention Is All You Need. NeurIPS, 2017.",
        "[3] Raffel et al. Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer. JMLR, 2020.",
        "[4] Izacard and Grave. Leveraging Passage Retrieval with Generative Models for Open Domain Question Answering. ACL, 2021.",
    ];

    public static void Build(string outputPath, string assetDir)
    {
        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var main = doc.AddMainDocumentPart();
        main.Document = new Document(new Body());

        var body = main.Document.Body!;
        var coverRel = TryEmbed(main, Path.Combine(assetDir, "front.png"));
        var backRel = TryEmbed(main, Path.Combine(assetDir, "closing.png"));

        RenderTitlePage(body, coverRel);
        RenderTocPage(body);
        RenderAbstract(body);

        foreach (var section in NarrativeSections.Take(2))
        {
            RenderNarrativeSection(body, section);
        }

        RenderResultSection(body);

        foreach (var section in NarrativeSections.Skip(2))
        {
            RenderNarrativeSection(body, section);
        }

        RenderReferenceSection(body);
        RenderBackPage(body, backRel);

        Fields.EnableAutoRefresh(main);
        main.Document.Save();
    }

    private static string? TryEmbed(MainDocumentPart main, string path)
    {
        return File.Exists(path) ? Media.EmbedImage(main, path) : null;
    }

    private static void RenderTitlePage(Body body, string? coverRel)
    {
        if (coverRel is not null)
        {
            body.Append(new Paragraph(new Run(
                Media.AnchoredBackdrop(coverRel, 300, "PaperCover", Metrics.A4WidthEmu, Metrics.A4HeightEmu)
            )));
        }

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(150, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }, Primitives.Gaps(0, 18)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 26, Theme.Heading, true), new Text("Operational Trade-offs in LLM Deployment"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }, Primitives.Gaps(0, 8)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 14, Theme.Muted), new Text("An empirical study on quality, latency and cost"))
        ));

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(50, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 12, Theme.Body), new Text("School of Computer Science"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 11, Theme.Muted), new Text($"{DateTime.UtcNow:yyyy MMM}"))
        ));
    }

    private static void RenderTocPage(Body body)
    {
        AddPageBreak(body);
        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(0, 14)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 20, Theme.Heading, true), new Text("Table of Contents"))
        ));

        body.Append(new Paragraph(Fields.TableOfContents(1, 3)));

        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(6, 8)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 9, Theme.Muted), new Text("If page numbers look incorrect, update the TOC field in Word."))
        ));
    }

    private static void RenderAbstract(Body body)
    {
        AddPageBreak(body);

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 16, Theme.Heading, true), new Text("Abstract"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Margins(0, 21), Primitives.Gaps(8, 8, 1.15)),
            new Run(
                Primitives.TextStyle("Times New Roman", "SimSun", 11, Theme.Body),
                new Text("This report evaluates practical deployment strategies for large language models under enterprise constraints. We compare quality outcomes, runtime latency, and operating overhead, then derive an engineering decision framework that balances capability and reliability.")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(4, 6)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 10.5, Theme.Body, true), new Text("Keywords: ")),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 10.5, Theme.Body), new Text("LLM deployment, inference optimization, reliability engineering"))
        ));
    }

    private static void RenderNarrativeSection(Body body, SectionPlan section)
    {
        AddPageBreak(body);
        var (start, end) = Fields.Anchor(section.BookmarkId, section.Bookmark);

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            start,
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 16, Theme.Heading, true), new Text(section.Heading)),
            end
        ));

        foreach (var paragraph in section.Paragraphs)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(Primitives.Margins(0, 21), Primitives.Gaps(6, 8, 1.2)),
                new Run(Primitives.TextStyle("Times New Roman", "SimSun", 11, Theme.Body), new Text(paragraph))
            ));
        }
    }

    private static void RenderResultSection(Body body)
    {
        AddPageBreak(body);
        var (start, end) = Fields.Anchor(25, "Results");

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            start,
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 16, Theme.Heading, true), new Text("3. Results")),
            end
        ));

        var rows = new List<string[]>
        {
            new[] { "Large model (full)", "0.932", "142", "2.6" },
            new[] { "Distilled model", "0.901", "74", "1.5" },
            new[] { "RAG + compact generator", "0.918", "88", "1.9" },
            new[] { "Rule-based baseline", "0.782", "31", "1.0" },
        };

        body.Append(Layout.Matrix(
            Layout.ThreeLineTable(Theme.Border),
            ["Configuration", "Macro-F1", "P95 Latency (ms)", "Relative Cost"],
            rows,
            [34, 16, 26, 24]
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }, Primitives.Gaps(6, 12)),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 9.5, Theme.Muted), new Text("Table 1. Comparative performance across deployment options"))
        ));
    }

    private static void RenderReferenceSection(Body body)
    {
        AddPageBreak(body);

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 16, Theme.Heading, true), new Text("References"))
        ));

        foreach (var entry in References)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(Primitives.Gaps(3, 3)),
                new Run(Primitives.TextStyle("Times New Roman", "SimSun", 10, Theme.Body), new Text(entry))
            ));
        }
    }

    private static void RenderBackPage(Body body, string? backRel)
    {
        AddPageBreak(body);

        if (backRel is not null)
        {
            body.Append(new Paragraph(new Run(
                Media.AnchoredBackdrop(backRel, 301, "PaperBack", Metrics.A4WidthEmu, Metrics.A4HeightEmu)
            )));
        }

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(280, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new Run(Primitives.TextStyle("Times New Roman", "SimSun", 11, Theme.Muted), new Text("Correspondence: research-office@example.edu"))
        ));
    }

    private static void AddPageBreak(Body body)
    {
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));
    }
}
