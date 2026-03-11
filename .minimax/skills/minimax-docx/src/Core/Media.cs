using System.Security;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace DocForge.Core;

public static class Media
{
    private const uint BackgroundLayerOrder = 251_658_240;

    public static string EmbedImage(MainDocumentPart mainPart, string imagePath)
    {
        var part = mainPart.AddImagePart(ResolveImageType(imagePath));
        using var stream = File.OpenRead(imagePath);
        part.FeedData(stream);
        return mainPart.GetIdOfPart(part);
    }

    public static Drawing AnchoredBackdrop(string relId, uint drawingId, string name, long widthEmu, long heightEmu)
    {
        var label = EscapeXml(name);
        var xml = $@"<wp:anchor xmlns:wp=""http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing""
           xmlns:a=""http://schemas.openxmlformats.org/drawingml/2006/main""
           xmlns:pic=""http://schemas.openxmlformats.org/drawingml/2006/picture""
           xmlns:r=""http://schemas.openxmlformats.org/officeDocument/2006/relationships""
           distT=""0"" distB=""0"" distL=""0"" distR=""0""
           simplePos=""0"" relativeHeight=""{BackgroundLayerOrder}""
           behindDoc=""1"" locked=""0"" layoutInCell=""1"" allowOverlap=""1"">
  <wp:simplePos x=""0"" y=""0""/>
  <wp:positionH relativeFrom=""page""><wp:posOffset>0</wp:posOffset></wp:positionH>
  <wp:positionV relativeFrom=""page""><wp:posOffset>0</wp:posOffset></wp:positionV>
  <wp:extent cx=""{widthEmu}"" cy=""{heightEmu}""/>
  <wp:effectExtent l=""0"" t=""0"" r=""0"" b=""0""/>
  <wp:wrapNone/>
  <wp:docPr id=""{drawingId}"" name=""{label}""/>
  <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect=""1""/></wp:cNvGraphicFramePr>
  {GraphicXml(relId, $"{label}-background", widthEmu, heightEmu)}
</wp:anchor>";

        return DrawingFromXml(xml);
    }

    public static Drawing InlineImage(string relId, uint drawingId, long widthEmu, long heightEmu)
    {
        var label = $"inline-{drawingId}";
        var xml = $@"<wp:inline xmlns:wp=""http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing""
           xmlns:a=""http://schemas.openxmlformats.org/drawingml/2006/main""
           xmlns:pic=""http://schemas.openxmlformats.org/drawingml/2006/picture""
           xmlns:r=""http://schemas.openxmlformats.org/officeDocument/2006/relationships""
           distT=""0"" distB=""0"" distL=""0"" distR=""0"">
  <wp:extent cx=""{widthEmu}"" cy=""{heightEmu}""/>
  <wp:effectExtent l=""0"" t=""0"" r=""0"" b=""0""/>
  <wp:docPr id=""{drawingId}"" name=""{EscapeXml(label)}""/>
  <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect=""1""/></wp:cNvGraphicFramePr>
  {GraphicXml(relId, label, widthEmu, heightEmu)}
</wp:inline>";

        return DrawingFromXml(xml);
    }

    private static string GraphicXml(string relId, string imageName, long widthEmu, long heightEmu)
    {
        return $@"<a:graphic>
  <a:graphicData uri=""http://schemas.openxmlformats.org/drawingml/2006/picture"">
    <pic:pic>
      <pic:nvPicPr>
        <pic:cNvPr id=""0"" name=""{EscapeXml(imageName)}.png""/>
        <pic:cNvPicPr/>
      </pic:nvPicPr>
      <pic:blipFill>
        <a:blip r:embed=""{EscapeXml(relId)}""/>
        <a:stretch><a:fillRect/></a:stretch>
      </pic:blipFill>
      <pic:spPr>
        <a:xfrm>
          <a:off x=""0"" y=""0""/>
          <a:ext cx=""{widthEmu}"" cy=""{heightEmu}""/>
        </a:xfrm>
        <a:prstGeom prst=""rect""><a:avLst/></a:prstGeom>
      </pic:spPr>
    </pic:pic>
  </a:graphicData>
</a:graphic>";
    }

    private static Drawing DrawingFromXml(string xml)
    {
        var drawing = new Drawing();
        drawing.InnerXml = xml;
        return drawing;
    }

    private static string EscapeXml(string input)
    {
        return SecurityElement.Escape(input) ?? string.Empty;
    }

    private static PartTypeInfo ResolveImageType(string imagePath)
    {
        return Path.GetExtension(imagePath).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => ImagePartType.Jpeg,
            ".gif" => ImagePartType.Gif,
            ".bmp" => ImagePartType.Bmp,
            ".png" => ImagePartType.Png,
            _ => ImagePartType.Png,
        };
    }
}
