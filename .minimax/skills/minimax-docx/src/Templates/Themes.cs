// Themes.cs - Document color palette definitions
// Provides cohesive color sets for consistent visual styling

namespace DocForge.Templates;

/// <summary>
/// Predefined color palettes for document styling.
/// Each theme defines colors for headings, body text, accents, and table elements.
/// </summary>
public static partial class Themes
{
    /// <summary>
    /// Represents a cohesive set of colors for document styling.
    /// All color values are 6-digit hex codes without the leading hash.
    /// </summary>
    public record ColorSet(
        string Heading,
        string Body,
        string Accent,
        string Muted,
        string TableHeader,
        string Border
    );

    /// <summary>Deep greens inspired by evergreen forests.</summary>
    public static readonly ColorSet Forest = new("1B4332", "2D3436", "40916C", "95A5A6", "52796F", "B7B7A4");

    /// <summary>Cool blues evoking ocean depths.</summary>
    public static readonly ColorSet Ocean = new("023E8A", "2B2D42", "0077B6", "8D99AE", "0096C7", "CAF0F8");

    /// <summary>Neutral grays with sage accents.</summary>
    public static readonly ColorSet Stone = new("3D405B", "1A1A2E", "81B29A", "A8A8A8", "5C5C5C", "E0E0E0");

    /// <summary>Warm sunset tones.</summary>
    public static readonly ColorSet Ember = new("9B2226", "212529", "CA6702", "ADB5BD", "BB3E03", "FFCCD5");

    /// <summary>Rich purples and violets.</summary>
    public static readonly ColorSet Amethyst = new("5A189A", "240046", "9D4EDD", "C8B6FF", "7B2CBF", "E0AAFF");

    /// <summary>Classic black and white with red accents.</summary>
    public static readonly ColorSet Monochrome = new("000000", "1C1C1C", "D62828", "6C757D", "343A40", "DEE2E6");

    /// <summary>Traditional ink brush style for classical texts.</summary>
    public static readonly ColorSet Ink = new("1A1A1A", "2C2C2C", "8B4513", "707070", "3C3C3C", "D4D4D4");
}
