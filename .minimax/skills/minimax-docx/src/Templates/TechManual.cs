using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocForge.Core;

namespace DocForge.Templates;

public static class TechManual
{
    private sealed record ManualChapter(string Bookmark, string Title, string[] Paragraphs);
    private sealed record SpecItem(string Metric, string Target, string Notes);
    private sealed record IncidentItem(string Symptom, string RootCause, string Action);

    private static readonly Themes.ColorSet Theme = Themes.Forest;

    private static readonly ManualChapter[] Chapters =
    [
        new(
            "Scope",
            "1. Scope and Intended Environment",
            [
                "This manual is intended for deployment engineers and operations staff responsible for commissioning, daily monitoring, and first-line diagnostics.",
                "The procedure assumes stable power input, controlled temperature, and a managed network segment with documented addressing rules."
            ]
        ),
        new(
            "Install",
            "2. Installation Workflow",
            [
                "Run a pre-flight check before rack-mounting: package integrity, accessory count, grounding path, and cable plan must all be confirmed.",
                "After physical setup, perform baseline verification in this order: power-on self-check, network reachability, service registration, and alarm channel validation."
            ]
        ),
        new(
            "Maintenance",
            "3. Routine Maintenance",
            [
                "Weekly tasks include health snapshot export, resource trend review, and backup consistency checks.",
                "Monthly tasks include firmware advisory review, capacity delta analysis, and incident postmortem updates to the operating runbook."
            ]
        ),
    ];

    private static readonly SpecItem[] Specs =
    [
        new("Input Power", "100-240V AC, 50/60Hz", "Single PSU supported; dual PSU optional"),
        new("Typical Draw", "42W", "Measured under nominal traffic"),
        new("Peak Draw", "68W", "Transient during startup"),
        new("Operating Temp", "0°C to 40°C", "Derate above 35°C in closed racks"),
        new("Storage Temp", "-20°C to 60°C", "Avoid rapid thermal cycling"),
        new("Humidity", "10% to 90% RH", "Non-condensing"),
    ];

    private static readonly IncidentItem[] Incidents =
    [
        new("Power LED remains off", "No upstream power or unstable input", "Validate PDU output and reseat power cable"),
        new("Management endpoint unavailable", "Address conflict or gateway mismatch", "Restore known-good network profile and verify ARP table"),
        new("Sustained thermal warning", "Blocked airflow path", "Remove obstructions and verify fan health"),
        new("Service starts but drops", "Dependency timeout", "Inspect startup logs and extend service warm-up threshold"),
    ];

    public static void Build(string outputPath, string assetDir)
    {
        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var main = doc.AddMainDocumentPart();
        main.Document = new Document(new Body());

        var body = main.Document.Body!;
        var coverRel = TryEmbed(main, Path.Combine(assetDir, "front.png"));
        var closingRel = TryEmbed(main, Path.Combine(assetDir, "closing.png"));

        RenderCover(body, coverRel);
        RenderToc(body);
        RenderSpecificationSection(body);
        RenderOperationalChecklist(body);

        var sectionId = 10;
        foreach (var chapter in Chapters)
        {
            RenderNarrativeChapter(body, sectionId++, chapter);
        }

        RenderIncidentSection(body, sectionId);
        RenderBackPage(body, closingRel);

        Fields.EnableAutoRefresh(main);
        main.Document.Save();
    }

    private static string? TryEmbed(MainDocumentPart main, string path)
    {
        if (!File.Exists(path))
        {
            return null;
        }

        return Media.EmbedImage(main, path);
    }

    private static void RenderCover(Body body, string? coverRel)
    {
        if (coverRel is not null)
        {
            body.Append(new Paragraph(new Run(
                Media.AnchoredBackdrop(coverRel, 100, "ManualCover", Metrics.A4WidthEmu, Metrics.A4HeightEmu)
            )));
        }

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(170, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }, Primitives.Gaps(0, 24)),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 34, Theme.Heading, true), new Text("Operations Manual"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }, Primitives.Gaps(0, 8)),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 16, Theme.Muted), new Text("Deployment, Verification and Incident Handling"))
        ));

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(40, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 11, Theme.Muted), new Text($"Prepared {DateTime.UtcNow:yyyy-MM-dd}"))
        ));
    }

    private static void RenderToc(Body body)
    {
        AddPageBreak(body);
        body.Append(ChapterTitle("Table of Contents", headingSize: 22));

        body.Append(new Paragraph(Fields.TableOfContents(1, 3, hyperlinks: true)));

        body.Append(new Paragraph(
            new ParagraphProperties(Primitives.Gaps(6, 8)),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 9, Theme.Muted), new Text("Tip: If the page numbers are stale, update the TOC field after opening the file."))
        ));
    }

    private static void RenderSpecificationSection(Body body)
    {
        AddPageBreak(body);
        var (start, end) = Fields.Anchor(1, "Specifications");
        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            start,
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 18, Theme.Heading, true), new Text("Technical Baseline")),
            end
        ));

        var rows = Specs
            .Select(item => new[] { item.Metric, item.Target, item.Notes })
            .ToList();

        var table = Layout.Matrix(
            Layout.ThreeLineTable(Theme.Border),
            ["Metric", "Target", "Notes"],
            rows,
            [26, 34, 40]
        );

        body.Append(table);
    }

    private static void RenderOperationalChecklist(Body body)
    {
        body.Append(ChapterTitle("Commissioning Checklist", headingSize: 16));

        var items = new[]
        {
            "Confirm node identity, rack location, and management label before activation.",
            "Validate clock source and NTP sync status before connecting upstream services.",
            "Record baseline CPU, memory, and I/O values for post-change comparison.",
            "Capture rollback command set and escalation contacts in the change record."
        };

        for (var i = 0; i < items.Length; i++)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(Primitives.Gaps(4, 4)),
                new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 11, Theme.Body, true), new Text($"{i + 1}. ")),
                new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 11, Theme.Body), new Text(items[i]))
            ));
        }
    }

    private static void RenderNarrativeChapter(Body body, int id, ManualChapter chapter)
    {
        AddPageBreak(body);
        var (start, end) = Fields.Anchor(id, chapter.Bookmark);

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            start,
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 17, Theme.Heading, true), new Text(chapter.Title)),
            end
        ));

        foreach (var paragraph in chapter.Paragraphs)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(Primitives.Margins(0, 18), Primitives.Gaps(5, 8, 1.15)),
                new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 11, Theme.Body), new Text(paragraph))
            ));
        }
    }

    private static void RenderIncidentSection(Body body, int id)
    {
        AddPageBreak(body);
        var (start, end) = Fields.Anchor(id, "IncidentPlaybook");

        body.Append(new Paragraph(
            Primitives.BlockStyle("Heading1", 0),
            start,
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 17, Theme.Heading, true), new Text("4. Incident Playbook")),
            end
        ));

        var rows = Incidents
            .Select(item => new[] { item.Symptom, item.RootCause, item.Action })
            .ToList();

        body.Append(Layout.Matrix(
            Layout.ThreeLineTable(Theme.Border),
            ["Symptom", "Likely Cause", "Recommended Action"],
            rows,
            [30, 30, 40]
        ));
    }

    private static void RenderBackPage(Body body, string? closingRel)
    {
        AddPageBreak(body);

        if (closingRel is not null)
        {
            body.Append(new Paragraph(new Run(
                Media.AnchoredBackdrop(closingRel, 200, "ManualBack", Metrics.A4WidthEmu, Metrics.A4HeightEmu)
            )));
        }

        body.Append(new Paragraph(new ParagraphProperties(Primitives.Gaps(280, 0))));

        body.Append(new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", 11, Theme.Muted), new Text("Support Channel: ops-support@example.com"))
        ));
    }

    private static Paragraph ChapterTitle(string text, double headingSize)
    {
        return new Paragraph(
            new ParagraphProperties(Primitives.Gaps(0, 14)),
            new Run(Primitives.TextStyle("Arial", "Microsoft YaHei", headingSize, Theme.Heading, true), new Text(text))
        );
    }

    private static void AddPageBreak(Body body)
    {
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));
    }
}
