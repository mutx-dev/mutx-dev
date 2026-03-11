// Metrics.cs - Unit conversion utilities for OpenXML document measurements
// Provides conversions between typographic units (points, twips, EMU, etc.)
// Reference: ECMA-376 Part 1, Section 17.18.95 (ST_TwipsMeasure)

namespace DocForge.Core;

/// <summary>
/// Unit conversion utilities for Word document measurements.
/// OpenXML uses multiple measurement units depending on context:
/// - Twips (1/20 of a point) for page dimensions and margins
/// - EMU (English Metric Units) for drawing elements
/// - Half-points for font sizes
/// </summary>
public static class Metrics
{
    // Paper size constants in Twips (portrait orientation)
    // 1 inch = 1440 twips, 1 cm = 567 twips

    /// <summary>A4 paper width: 210mm = 11906 twips</summary>
    public const int A4Width = 11906;

    /// <summary>A4 paper height: 297mm = 16838 twips</summary>
    public const int A4Height = 16838;

    /// <summary>A3 paper width: 297mm = 16838 twips</summary>
    public const int A3Width = 16838;

    /// <summary>A3 paper height: 420mm = 23811 twips</summary>
    public const int A3Height = 23811;

    /// <summary>A5 paper width: 148mm = 8391 twips</summary>
    public const int A5Width = 8391;

    /// <summary>A5 paper height: 210mm = 11906 twips</summary>
    public const int A5Height = 11906;

    /// <summary>B5 paper width: 176mm = 9979 twips</summary>
    public const int B5Width = 9979;

    /// <summary>B5 paper height: 250mm = 14175 twips</summary>
    public const int B5Height = 14175;

    /// <summary>B4 paper width: 250mm = 14175 twips</summary>
    public const int B4Width = 14175;

    /// <summary>B4 paper height: 353mm = 20025 twips</summary>
    public const int B4Height = 20025;

    /// <summary>US Letter width: 8.5in = 12240 twips</summary>
    public const int LetterWidth = 12240;

    /// <summary>US Letter height: 11in = 15840 twips</summary>
    public const int LetterHeight = 15840;

    /// <summary>US Legal width: 8.5in = 12240 twips</summary>
    public const int LegalWidth = 12240;

    /// <summary>US Legal height: 14in = 20160 twips</summary>
    public const int LegalHeight = 20160;

    // Paper size constants in EMU (for drawing operations)

    /// <summary>A4 width in EMU: 210mm</summary>
    public const long A4WidthEmu = 7560000L;

    /// <summary>A4 height in EMU: 297mm</summary>
    public const long A4HeightEmu = 10692000L;

    /// <summary>A3 width in EMU: 297mm</summary>
    public const long A3WidthEmu = 10692000L;

    /// <summary>A3 height in EMU: 420mm</summary>
    public const long A3HeightEmu = 15120000L;

    /// <summary>A5 width in EMU: 148mm</summary>
    public const long A5WidthEmu = 5328000L;

    /// <summary>A5 height in EMU: 210mm</summary>
    public const long A5HeightEmu = 7560000L;

    /// <summary>B5 width in EMU: 176mm</summary>
    public const long B5WidthEmu = 6336000L;

    /// <summary>B5 height in EMU: 250mm</summary>
    public const long B5HeightEmu = 9000000L;

    /// <summary>B4 width in EMU: 250mm</summary>
    public const long B4WidthEmu = 9000000L;

    /// <summary>B4 height in EMU: 353mm</summary>
    public const long B4HeightEmu = 12708000L;

    /// <summary>
    /// Converts typographic points to twips.
    /// One point equals 20 twips (1/72 inch = 20/1440 inch).
    /// </summary>
    public static int PtToTwips(double pt) => (int)(pt * 20);

    /// <summary>
    /// Converts twips to EMU (English Metric Units).
    /// One twip equals 635 EMU. Used for DrawingML positioning.
    /// </summary>
    public static long TwipsToEmu(int twips) => twips * 635L;

    /// <summary>
    /// Converts centimeters to twips.
    /// One centimeter equals approximately 567 twips.
    /// </summary>
    public static int CmToTwips(double cm) => (int)(cm * 567);

    /// <summary>
    /// Converts inches to twips.
    /// One inch equals exactly 1440 twips.
    /// </summary>
    public static int InchToTwips(double inch) => (int)(inch * 1440);

    /// <summary>
    /// Converts points to half-points for FontSize.Val.
    /// OpenXML stores font sizes in half-points (12pt = "24").
    /// </summary>
    public static string PtToHalfPoints(double pt) => ((int)(pt * 2)).ToString();

    /// <summary>
    /// Converts points to EMU directly. One point = 12700 EMU.
    /// </summary>
    public static long PtToEmu(double pt) => (long)(pt * 12700);

    /// <summary>
    /// Converts percentage (0-100) to fiftieths of a percent.
    /// TableWidth Pct type uses 5000 = 100%.
    /// </summary>
    public static string PercentToFifths(int percent) => (percent * 50).ToString();
}
