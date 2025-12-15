import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

interface GeneratedField {
    name: string;
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const { fields } = await req.json();

        if (!fields || !Array.isArray(fields)) {
            return NextResponse.json(
                { error: '請提供生成的報告內容' },
                { status: 400 }
            );
        }

        // Helper function to parse bold text
        const parseTextWithBold = (text: string, size: number = 24) => {
            const parts = text.split(/(\*\*[^*]+\*\*)/g);
            return parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.slice(2, -2),
                        bold: true,
                        size: size
                    });
                }
                return new TextRun({
                    text: part,
                    size: size
                });
            });
        };

        // Helper to parse Markdown content into DOCX elements
        const parseMarkdownToDocx = (content: string) => {
            const elements: (Paragraph | Table)[] = [];
            const lines = content.split('\n');
            let inTable = false;
            let tableRows: string[][] = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Handle Tables
                if (line.startsWith('|')) {
                    if (!inTable) {
                        inTable = true;
                        tableRows = [];
                    }
                    // Extract cells, filtering out empty strings from split
                    const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
                    // Skip separator line (e.g. |---|---|)
                    if (!line.includes('---')) {
                        tableRows.push(cells);
                    }
                    continue; // Skip processing this line as text
                } else if (inTable) {
                    // End of table detected
                    inTable = false;
                    // Create DOCX Table
                    if (tableRows.length > 0) {
                        const docxRows = tableRows.map((row) =>
                            new TableRow({
                                children: row.map(cellText =>
                                    new TableCell({
                                        children: [new Paragraph({ children: parseTextWithBold(cellText, 20) })],
                                        width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    })
                                )
                            })
                        );
                        elements.push(new Table({
                            rows: docxRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        }));
                        elements.push(new Paragraph({ text: "" })); // Spacing after table
                    }
                }

                if (line === '') {
                    elements.push(new Paragraph({ text: "" }));
                    continue;
                }

                // Headers (### )
                if (line.startsWith('### ')) {
                    elements.push(new Paragraph({
                        children: parseTextWithBold(line.replace('### ', '')),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    }));
                    continue;
                }
                if (line.startsWith('## ')) {
                    elements.push(new Paragraph({
                        children: parseTextWithBold(line.replace('## ', '')),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 240, after: 120 }
                    }));
                    continue;
                }

                // List Items
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    elements.push(new Paragraph({
                        children: parseTextWithBold(line.replace(/^[-*] /, '')),
                        bullet: { level: 0 },
                        spacing: { after: 50 }
                    }));
                    continue;
                }

                // Normal Paragraph
                elements.push(new Paragraph({
                    children: parseTextWithBold(line),
                    spacing: { after: 100 }
                }));
            }

            // Generate any pending table at the end
            if (inTable && tableRows.length > 0) {
                const docxRows = tableRows.map((row) =>
                    new TableRow({
                        children: row.map(cellText =>
                            new TableCell({
                                children: [new Paragraph({ children: parseTextWithBold(cellText, 20) })],
                                width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                            })
                        )
                    })
                );
                elements.push(new Table({
                    rows: docxRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                }));
            }

            return elements;
        };

        // Create document sections
        const docChildren: (Paragraph | Table)[] = [];

        // Add title
        docChildren.push(
            new Paragraph({
                text: '現場勘查報告',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        );

        // Add generated date
        const reportDate = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        docChildren.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: `報告日期：${reportDate}`,
                        size: 24,
                    }),
                ],
            })
        );

        // Add separator
        docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));

        // Add each field
        fields.forEach((field: GeneratedField) => {
            // Field heading
            docChildren.push(
                new Paragraph({
                    text: field.name, // Fixed: using name instead of label
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 300, after: 200 },
                })
            );

            // Parse content
            const contentElements = parseMarkdownToDocx(field.content);
            docChildren.push(...contentElements);

            // Add spacing after each field
            docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        });

        // Create document
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: docChildren,
                },
            ],
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        // Return as blob
        const uint8Array = new Uint8Array(buffer);
        return new NextResponse(new Blob([uint8Array]), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="report.docx"',
            },
        });
    } catch (error) {
        console.error('Error creating document:', error);
        return NextResponse.json(
            { error: '生成文件時發生錯誤' },
            { status: 500 }
        );
    }
}
