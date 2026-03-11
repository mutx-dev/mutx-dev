using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace DocForge.Core;

public static class Fields
{
    public static SimpleField CurrentPage() => CreateSimpleField("PAGE", "1");

    public static SimpleField TotalPages() => CreateSimpleField("NUMPAGES", "1");

    public static SimpleField TableOfContents(int fromLevel, int toLevel, bool hyperlinks = true)
    {
        var start = Math.Clamp(fromLevel, 1, 9);
        var end = Math.Clamp(toLevel, start, 9);
        var instruction = $"TOC \\o \"{start}-{end}\"";

        if (hyperlinks)
        {
            instruction += " \\h";
        }

        instruction += " \\z \\u";
        return CreateSimpleField(instruction, "");
    }

    public static Hyperlink CrossRef(string bookmarkName, string displayText)
    {
        var anchor = string.IsNullOrWhiteSpace(bookmarkName) ? "_RefFallback" : bookmarkName.Trim();
        var text = string.IsNullOrWhiteSpace(displayText) ? "Reference" : displayText;

        return new Hyperlink(new Run(new Text(text)))
        {
            Anchor = anchor,
            History = true,
        };
    }

    public static (BookmarkStart, BookmarkEnd) Anchor(int id, string name)
    {
        var normalized = id < 0 ? 0 : id;
        var safeName = string.IsNullOrWhiteSpace(name) ? $"Bookmark_{normalized}" : name.Trim();

        return (
            new BookmarkStart { Id = normalized.ToString(), Name = safeName },
            new BookmarkEnd { Id = normalized.ToString() }
        );
    }

    public static void EnableAutoRefresh(MainDocumentPart mainPart)
    {
        var settingsPart = mainPart.DocumentSettingsPart;
        if (settingsPart is null)
        {
            settingsPart = mainPart.AddNewPart<DocumentSettingsPart>();
            settingsPart.Settings = new Settings();
        }

        settingsPart.Settings ??= new Settings();

        var updateNode = settingsPart.Settings.Elements<UpdateFieldsOnOpen>().FirstOrDefault();
        if (updateNode is null)
        {
            settingsPart.Settings.Append(new UpdateFieldsOnOpen { Val = true });
            return;
        }

        updateNode.Val = true;
    }

    private static SimpleField CreateSimpleField(string instruction, string previewText)
    {
        var field = new SimpleField
        {
            Instruction = $" {instruction} ",
        };

        if (!string.IsNullOrEmpty(previewText))
        {
            field.Append(new Run(new Text(previewText)));
        }

        return field;
    }
}
