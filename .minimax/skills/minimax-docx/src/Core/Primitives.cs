// Primitives.cs - Basic building blocks for Word document content
// Creates paragraphs, text runs, and their associated properties
// Reference: ECMA-376 Part 1, Section 17.3 (Paragraphs) and 17.3.2 (Runs)

using DocumentFormat.OpenXml.Wordprocessing;

namespace DocForge.Core;

/// <summary>
/// Factory methods for creating fundamental document elements.
/// Paragraphs contain runs, runs contain text with formatting.
/// </summary>
public static class Primitives
{
    /// <summary>
    /// Creates a paragraph containing plain text with optional style.
    /// A paragraph is the primary block-level container in WordprocessingML.
    /// </summary>
    /// <param name="content">Text content of the paragraph</param>
    /// <param name="styleId">Optional style identifier (e.g., "Heading1")</param>
    /// <returns>A Paragraph element ready to append to document body</returns>
    public static Paragraph TextBlock(string content, string? styleId = null)
    {
        var para = new Paragraph();

        if (styleId != null)
        {
            para.Append(new ParagraphProperties(new ParagraphStyleId { Val = styleId }));
        }

        para.Append(new Run(new Text(content)));
        return para;
    }

    /// <summary>
    /// Creates a text run with optional formatting properties.
    /// A run is an inline region of text sharing the same properties.
    /// </summary>
    /// <param name="text">Text content</param>
    /// <param name="props">Optional RunProperties for formatting</param>
    /// <returns>A Run element containing the text</returns>
    public static Run TextRun(string text, RunProperties? props = null)
    {
        var run = new Run();

        if (props != null)
        {
            run.Append(props);
        }

        run.Append(new Text(text));
        return run;
    }

    /// <summary>
    /// Creates run properties for text formatting.
    /// Controls font, size, color, and weight of text within a run.
    /// </summary>
    /// <param name="fontAscii">Font for Latin characters (e.g., "Calibri")</param>
    /// <param name="fontCjk">Font for CJK characters (e.g., "SimHei")</param>
    /// <param name="sizePt">Font size in points</param>
    /// <param name="color">Optional hex color without # (e.g., "FF0000")</param>
    /// <param name="bold">Whether text should be bold</param>
    /// <returns>RunProperties configured with specified formatting</returns>
    public static RunProperties TextStyle(
        string fontAscii,
        string fontCjk,
        double sizePt,
        string? color = null,
        bool bold = false)
    {
        var props = new RunProperties();

        props.Append(new RunFonts
        {
            Ascii = fontAscii,
            HighAnsi = fontAscii,
            EastAsia = fontCjk
        });

        props.Append(new FontSize { Val = Metrics.PtToHalfPoints(sizePt) });

        if (color != null)
        {
            props.Append(new Color { Val = color });
        }

        if (bold)
        {
            props.Append(new Bold());
        }

        return props;
    }

    /// <summary>
    /// Creates paragraph properties with style and optional outline level.
    /// Outline level determines heading hierarchy for TOC generation.
    /// </summary>
    /// <param name="styleId">Style identifier to apply</param>
    /// <param name="outlineLevel">Optional outline level (0=H1, 1=H2, etc.)</param>
    /// <returns>ParagraphProperties for the paragraph</returns>
    public static ParagraphProperties BlockStyle(string styleId, int? outlineLevel = null)
    {
        var props = new ParagraphProperties();
        props.Append(new ParagraphStyleId { Val = styleId });

        if (outlineLevel.HasValue)
        {
            props.Append(new OutlineLevel { Val = outlineLevel.Value });
        }

        return props;
    }

    /// <summary>
    /// Creates spacing settings for paragraphs.
    /// Controls vertical space before/after and line height.
    /// </summary>
    /// <param name="beforePt">Space before paragraph in points</param>
    /// <param name="afterPt">Space after paragraph in points</param>
    /// <param name="lineMultiple">Line spacing multiplier (1.0=single, 1.5=one-and-half)</param>
    /// <returns>SpacingBetweenLines element</returns>
    public static SpacingBetweenLines Gaps(double beforePt, double afterPt, double lineMultiple = 1.0)
    {
        return new SpacingBetweenLines
        {
            Before = Metrics.PtToTwips(beforePt).ToString(),
            After = Metrics.PtToTwips(afterPt).ToString(),
            Line = ((int)(lineMultiple * 240)).ToString(),
            LineRule = LineSpacingRuleValues.Auto
        };
    }

    /// <summary>
    /// Creates indentation settings for paragraphs.
    /// First line indent is commonly used for CJK body text (2 chars = ~420 twips).
    /// </summary>
    /// <param name="leftPt">Left margin in points</param>
    /// <param name="firstLinePt">First line indent in points (0 for no indent)</param>
    /// <returns>Indentation element</returns>
    public static Indentation Margins(double leftPt, double firstLinePt = 0)
    {
        var indent = new Indentation
        {
            Left = Metrics.PtToTwips(leftPt).ToString()
        };

        if (firstLinePt > 0)
        {
            indent.FirstLine = Metrics.PtToTwips(firstLinePt).ToString();
        }

        return indent;
    }
}
