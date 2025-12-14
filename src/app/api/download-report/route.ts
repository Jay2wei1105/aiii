import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface GeneratedField {
    label: string;
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const { fields, template } = await req.json();

        if (!fields || !Array.isArray(fields)) {
            return NextResponse.json(
                { error: '請提供生成的報告內容' },
                { status: 400 }
            );
        }

        // Create document sections
        const sections: Paragraph[] = [];

        // Add title
        sections.push(
            new Paragraph({
                text: '現場勘查報告',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 400,
                },
            })
        );

        // Add generated date
        const reportDate = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        sections.push(
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
        sections.push(
            new Paragraph({
                text: '',
                spacing: { after: 200 },
            })
        );

        // Add each field
        fields.forEach((field: GeneratedField) => {
            // Field heading
            sections.push(
                new Paragraph({
                    text: field.label,
                    heading: HeadingLevel.HEADING_1,
                    spacing: {
                        before: 300,
                        after: 200,
                    },
                })
            );

            // Field content - split by newlines to preserve formatting
            const contentLines = field.content.split('\n');
            contentLines.forEach((line: string) => {
                sections.push(
                    new Paragraph({
                        spacing: { after: 100 },
                        children: [
                            new TextRun({
                                text: line,
                                size: 24,
                            }),
                        ],
                    })
                );
            });

            // Add spacing after each field
            sections.push(
                new Paragraph({
                    text: '',
                    spacing: { after: 200 },
                })
            );
        });

        // Create document
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: sections,
                },
            ],
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        // Return as blob
        return new NextResponse(buffer, {
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
