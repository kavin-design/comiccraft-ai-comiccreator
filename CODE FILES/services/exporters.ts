import { jsPDF } from 'jspdf';
import type { ComicPanelLayout, ComicMetadata } from './types';

/**
 * Safely converts an image (including SVG or remote URL) to a high-compatibility JPEG base64 string
 * to prevent jsPDF addImage errors with SVGs or tainted data.
 */
async function ensureJpegDataUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';

  // If already standard JPEG or PNG base64, return directly
  if (imageUrl.startsWith('data:image/jpeg') || imageUrl.startsWith('data:image/png')) {
    return imageUrl;
  }

  // If it's SVG data or URL, render on temporary canvas
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 768;
        canvas.height = img.naturalHeight || 768;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(jpegUrl);
          return;
        }
      } catch (err) {
        console.warn('Canvas conversion fallback in exporter failed:', err);
      }
      resolve(imageUrl);
    };
    img.onerror = () => {
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
}

/**
 * Generates and downloads a multi-page PDF of the comic strip using jsPDF.
 * Page 1: Cover page (comic title, character name, tone, and art style)
 * Pages 2-6: One page per panel (title, image, scene description, caption, narration)
 *
 * @param layout Array of 5 ComicPanelLayout objects
 * @param meta Comic metadata (title, character, tone, art style, setting)
 * @returns Generated filename
 */
export async function savePdf(
  layout: ComicPanelLayout[],
  meta: ComicMetadata
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  // Decorative comic double border
  doc.setLineWidth(1.5);
  doc.setDrawColor(24, 24, 27); // Dark zinc
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin - 4) * 2);
  doc.setLineWidth(0.5);
  doc.rect(margin - 1, margin - 1, contentWidth + 2, pageHeight - (margin - 1) * 2);

  // Top Comic Banner
  doc.setFillColor(250, 204, 21); // Amber / yellow-400
  doc.rect(margin + 4, margin + 8, contentWidth - 8, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('★ COMICCRAFT ORIGINAL AI COMIC STRIP ★', pageWidth / 2, margin + 17, { align: 'center' });

  // Main Comic Title
  const comicTitle = meta.title || `${meta.characterName}'s Tale`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900

  const titleLines = doc.splitTextToSize(comicTitle, contentWidth - 10);
  const titleY = margin + 46;
  doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

  // Subtitle / Premise
  const subtitleY = titleY + titleLines.length * 10 + 6;
  if (meta.originalPrompt) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-600
    const promptLines = doc.splitTextToSize(`"${meta.originalPrompt}"`, contentWidth - 20);
    doc.text(promptLines, pageWidth / 2, subtitleY, { align: 'center' });
  }

  // Cover Feature Box
  const boxY = subtitleY + 28;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(1);
  doc.roundedRect(margin + 12, boxY, contentWidth - 24, 60, 4, 4, 'FD');

  // Character Label & Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('STARRING HERO', pageWidth / 2, boxY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(meta.characterName || 'The Hero', pageWidth / 2, boxY + 25, { align: 'center' });

  // Metadata Row inside Cover Box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const metaDetails = [
    `Setting: ${meta.setting || 'Adventure'}`,
    `Tone: ${meta.storyTone || 'Exciting'}`,
    `Style: ${meta.artStyle || 'Comic Book'}`,
  ].join('    |    ');
  doc.text(metaDetails, pageWidth / 2, boxY + 44, { align: 'center' });

  // Cover Page Bottom Badge
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 20, pageHeight - 55, contentWidth - 40, 24, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('A 5-PANEL STORY GENERATED WITH GEMINI AI', pageWidth / 2, pageHeight - 43, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(new Date().toLocaleDateString(undefined, { dateStyle: 'long' }), pageWidth / 2, pageHeight - 37, { align: 'center' });

  // ----------------------------------------------------
  // PAGES 2 - 6: ONE PAGE PER PANEL
  // ----------------------------------------------------
  for (let i = 0; i < layout.length; i++) {
    const panel = layout[i];
    doc.addPage();

    // Border around panel page
    doc.setDrawColor(24, 24, 27);
    doc.setLineWidth(1);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin - 2) * 2);

    // Panel Header (Formatted: "Panel X: Title")
    const panelTitleText = `Panel ${panel.panelNumber}: ${panel.title}`;
    doc.setFillColor(254, 240, 138); // Yellow accent
    doc.rect(margin + 2, margin + 4, contentWidth - 4, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(panelTitleText, pageWidth / 2, margin + 12, { align: 'center' });

    let currentY = margin + 22;

    // Panel Illustration
    const imgSize = 120; // 120mm x 120mm square
    const imgX = (pageWidth - imgSize) / 2;

    if (panel.imageUrl) {
      try {
        const safeDataUrl = await ensureJpegDataUrl(panel.imageUrl);
        if (safeDataUrl) {
          // Draw comic image border
          doc.setLineWidth(1.2);
          doc.setDrawColor(24, 24, 27);
          doc.rect(imgX - 1, currentY - 1, imgSize + 2, imgSize + 2);
          doc.addImage(safeDataUrl, 'JPEG', imgX, currentY, imgSize, imgSize);
        }
      } catch (imgErr) {
        console.warn('PDF image insertion warning:', imgErr);
        // Fallback box if addImage failed
        doc.setFillColor(243, 244, 246);
        doc.rect(imgX, currentY, imgSize, imgSize, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text(`[Panel ${panel.panelNumber} Illustration]`, pageWidth / 2, currentY + imgSize / 2, { align: 'center' });
      }
    }

    currentY += imgSize + 8;

    // Scene description (in italics)
    if (panel.sceneDescription) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // slate-600
      const sceneLines = doc.splitTextToSize(panel.sceneDescription, contentWidth - 10);
      doc.text(sceneLines, margin + 6, currentY);
      currentY += sceneLines.length * 4.5 + 4;
    }

    // Caption (brief ambient description or sound effects in yellow callout box)
    if (panel.caption) {
      const captionLines = doc.splitTextToSize(`⚡ ${panel.caption}`, contentWidth - 16);
      const captionBoxHeight = Math.max(10, captionLines.length * 4.5 + 4);

      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.setLineWidth(0.6);
      doc.roundedRect(margin + 4, currentY, contentWidth - 8, captionBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(146, 64, 14); // amber-900
      doc.text(captionLines, margin + 8, currentY + 6);

      currentY += captionBoxHeight + 5;
    }

    // Narration and dialogue (character speech in quotes)
    if (panel.narration) {
      const narrationLines = doc.splitTextToSize(panel.narration, contentWidth - 16);
      const narrationBoxHeight = Math.max(14, narrationLines.length * 5 + 6);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(24, 24, 27);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin + 4, currentY, contentWidth - 8, narrationBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(narrationLines, margin + 8, currentY + 6);

      currentY += narrationBoxHeight + 4;
    }

    // Footer on panel page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`ComicCraft • Panel ${panel.panelNumber} of ${layout.length}`, pageWidth / 2, pageHeight - 8, {
      align: 'center',
    });
  }

  // Generate Filename: ComicCraft_<timestamp>.pdf
  const timestamp = Date.now();
  const filename = `ComicCraft_${timestamp}.pdf`;

  // Trigger browser download
  doc.save(filename);

  return filename;
}
