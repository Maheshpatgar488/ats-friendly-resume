import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function generateDocx(resumeData) {
  const {
    personalInfo = {},
    summary = "",
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    languages = []
  } = resumeData;

  const sections = [];

  // --- HEADER (Personal Info) ---
  sections.push(
    new Paragraph({
      text: personalInfo.fullName || "Your Name",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  const contactDetails = [];
  if (personalInfo.email) contactDetails.push(personalInfo.email);
  if (personalInfo.phone) contactDetails.push(personalInfo.phone);
  if (personalInfo.location) contactDetails.push(personalInfo.location);
  if (personalInfo.linkedin) contactDetails.push(personalInfo.linkedin);

  if (contactDetails.length > 0) {
    sections.push(
      new Paragraph({
        text: contactDetails.join(" | "),
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // --- SUMMARY ---
  if (summary) {
    sections.push(
      new Paragraph({
        text: "Professional Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: summary,
        spacing: { after: 200 },
      })
    );
  }

  // --- EXPERIENCE ---
  if (experience.length > 0) {
    sections.push(
      new Paragraph({
        text: "Experience",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    experience.forEach(exp => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: 24 }),
            new TextRun({ text: ` | ${exp.company}`, italics: true, size: 24 }),
            new TextRun({
              text: `\t${exp.startDate} - ${exp.endDate}`,
              size: 24
            })
          ],
          tabStops: [{ type: "right", position: 9000 }],
          spacing: { after: 50 },
        })
      );

      if (exp.description && Array.isArray(exp.description)) {
        exp.description.forEach(bullet => {
          if (bullet.trim()) {
            sections.push(
              new Paragraph({
                text: bullet,
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 },
              })
            );
          }
        });
      }

      if (exp.highlights && Array.isArray(exp.highlights)) {
        exp.highlights.forEach(highlight => {
          if (highlight.trim()) {
            sections.push(
              new Paragraph({
                text: highlight,
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 },
              })
            );
          }
        });
      }
      
      sections.push(new Paragraph({ spacing: { after: 100 } })); // space between jobs
    });
  }

  // --- EDUCATION ---
  if (education.length > 0) {
    sections.push(
      new Paragraph({
        text: "Education",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    education.forEach(edu => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 24 }),
            new TextRun({
              text: `\t${edu.startDate} - ${edu.endDate}`,
              size: 24
            })
          ],
          tabStops: [{ type: "right", position: 9000 }],
        }),
        new Paragraph({
          children: [new TextRun({ text: edu.institution, italics: true, size: 24 })],
          spacing: { after: 150 },
        })
      );
    });
  }

  // --- SKILLS ---
  if (skills.length > 0) {
    sections.push(
      new Paragraph({
        text: "Skills",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: skills.join(", "),
        spacing: { after: 200 },
      })
    );
  }

  // --- PROJECTS ---
  if (projects.length > 0) {
    sections.push(
      new Paragraph({
        text: "Projects",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    projects.forEach(proj => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
          spacing: { after: 50 },
        })
      );
      
      if (proj.technologies && proj.technologies.length > 0) {
        sections.push(
          new Paragraph({
            text: `Technologies: ${proj.technologies.join(", ")}`,
            italics: true,
            spacing: { after: 50 },
          })
        );
      }
      
      if (proj.description && Array.isArray(proj.description)) {
        proj.description.forEach(desc => {
          if (desc.trim()) {
            sections.push(
              new Paragraph({
                text: desc,
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 },
              })
            );
          }
        });
      }
      sections.push(new Paragraph({ spacing: { after: 100 } })); // space between projects
    });
  }

  // Build the doc
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 48,
            bold: true,
            color: "000000",
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              after: 120,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "333333",
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
            border: {
              bottom: { color: "aaaaaa", space: 1, value: "single", size: 6 },
            },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          quickFormat: true,
          run: {
            size: 22,
            font: "Calibri",
            color: "000000"
          },
          paragraph: {
            spacing: {
              line: 276,
            },
          },
        },
      ],
    }
  });

  // Pack to a buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
