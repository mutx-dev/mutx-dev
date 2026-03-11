using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Wordprocessing;

namespace DocForge.Core;

public static class Layout
{
    public static Table Grid(TableProperties props, params TableRow[] rows)
    {
        var table = new Table(props.CloneNode(true));
        foreach (var row in rows)
        {
            table.Append(row);
        }
        return table;
    }

    public static Table Matrix(
        TableProperties props,
        string[] headers,
        IReadOnlyList<string[]> rows,
        int[] widthPercents)
    {
        var resolvedWidths = ResolveWidths(widthPercents, headers.Length);
        var table = new Table(props.CloneNode(true));
        table.Append(HeaderRow(headers, resolvedWidths));

        foreach (var row in rows)
        {
            table.Append(DataRow(row, resolvedWidths));
        }

        return table;
    }

    public static TableRow HeaderRow(string[] cells, int[] widthPercents)
    {
        var widths = ResolveWidths(widthPercents, cells.Length);
        return CreateRow(cells, widths, isHeader: true);
    }

    public static TableRow DataRow(string[] cells, int[] widthPercents)
    {
        var widths = ResolveWidths(widthPercents, cells.Length);
        return CreateRow(cells, widths, isHeader: false);
    }

    public static TableCell Cell(string text, TableCellProperties props)
    {
        return new TableCell(
            props,
            new Paragraph(new Run(new Text(text)))
        );
    }

    public static SectionProperties PageSetup(int widthTwips, int heightTwips, bool landscape = false)
    {
        var size = landscape
            ? new PageSize
            {
                Width = (UInt32Value)(uint)heightTwips,
                Height = (UInt32Value)(uint)widthTwips,
                Orient = PageOrientationValues.Landscape,
            }
            : new PageSize
            {
                Width = (UInt32Value)(uint)widthTwips,
                Height = (UInt32Value)(uint)heightTwips,
            };

        return new SectionProperties(size);
    }

    public static PageMargin EdgeSpacing(double topPt, double rightPt, double bottomPt, double leftPt)
    {
        return new PageMargin
        {
            Top = Metrics.PtToTwips(topPt),
            Right = (uint)Metrics.PtToTwips(rightPt),
            Bottom = Metrics.PtToTwips(bottomPt),
            Left = (uint)Metrics.PtToTwips(leftPt),
            Header = 720,
            Footer = 720,
        };
    }

    public static Columns MultiColumn(int count, double gapPt)
    {
        return new Columns
        {
            ColumnCount = (short)Math.Clamp(count, 1, short.MaxValue),
            EqualWidth = true,
            Space = Metrics.PtToTwips(gapPt).ToString(),
        };
    }

    public static TableProperties ThreeLineTable(string borderColor)
    {
        return new TableProperties(
            new TableWidth { Width = "0", Type = TableWidthUnitValues.Auto },
            new TableLayout { Type = TableLayoutValues.Fixed },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 12, Color = borderColor },
                new BottomBorder { Val = BorderValues.Single, Size = 12, Color = borderColor },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Color = borderColor }
            )
        );
    }

    private static TableRow CreateRow(IReadOnlyList<string> cells, IReadOnlyList<int> widths, bool isHeader)
    {
        var row = new TableRow();
        if (isHeader)
        {
            row.Append(new TableRowProperties(new TableHeader()));
        }

        for (var i = 0; i < cells.Count; i++)
        {
            var paragraph = new Paragraph(
                new ParagraphProperties(
                    new Justification
                    {
                        Val = isHeader ? JustificationValues.Center : JustificationValues.Left,
                    }
                ),
                isHeader
                    ? new Run(new RunProperties(new Bold()), new Text(cells[i]))
                    : new Run(new Text(cells[i]))
            );

            row.Append(new TableCell(BuildCellProperties(widths[i]), paragraph));
        }

        return row;
    }

    private static TableCellProperties BuildCellProperties(int widthPercent)
    {
        return new TableCellProperties(
            new TableCellWidth
            {
                Width = Metrics.PercentToFifths(widthPercent),
                Type = TableWidthUnitValues.Pct,
            },
            new TableCellVerticalAlignment { Val = TableVerticalAlignmentValues.Center }
        );
    }

    private static int[] ResolveWidths(IReadOnlyList<int> widths, int columns)
    {
        if (columns <= 0)
        {
            return [];
        }

        if (widths.Count == columns && widths.All(v => v > 0))
        {
            return widths.ToArray();
        }

        var equal = 100 / columns;
        var resolved = Enumerable.Repeat(equal, columns).ToArray();
        resolved[^1] += 100 - resolved.Sum();
        return resolved;
    }
}
