namespace DocForge.TemplateDriven;

public sealed record TemplateProfile(
    int SectionCount,
    int ParagraphCount,
    int TableCount,
    int BookmarkCount,
    int PageBreakCount,
    bool HasTocField,
    bool HasHeader,
    bool HasFooter,
    bool HasTitlePageSetting,
    bool HasSignatureCue
)
{
    public bool IsLightweightTemplate =>
        TableCount <= 3 &&
        ParagraphCount <= 120 &&
        !HasTocField;

    public string Summary =>
        $"sections={SectionCount}, paragraphs={ParagraphCount}, tables={TableCount}, toc={HasTocField}, titlePage={HasTitlePageSetting}, signatureCue={HasSignatureCue}";
}
