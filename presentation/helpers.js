// Shared tiny helpers used by all 3 variations
const makeShadow = (opacity = 0.15) => ({
  type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity,
});

function titleBar(slide, theme, title, subtitle) {
  slide.addShape("rect", {
    x: 0.5, y: 0.45, w: 0.35, h: 0.35,
    fill: { color: theme.accent }, line: { color: theme.accent },
  });
  slide.addText(title, {
    x: 1.0, y: 0.4, w: 9, h: 0.55,
    fontFace: theme.header, fontSize: 28, color: theme.text, bold: true, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.0, y: 0.95, w: 9, h: 0.35,
      fontFace: theme.body, fontSize: 13, color: theme.muted, italic: true, margin: 0,
    });
  }
}

function footer(slide, theme, leftText, pageNum) {
  slide.addShape("rect", {
    x: 0, y: 5.4, w: 10, h: 0.03,
    fill: { color: theme.cardBorder }, line: { color: theme.cardBorder },
  });
  slide.addText(leftText, {
    x: 0.5, y: 5.43, w: 7, h: 0.2,
    fontFace: theme.body, fontSize: 9, color: theme.muted, margin: 0,
  });
  slide.addText(String(pageNum), {
    x: 9.2, y: 5.43, w: 0.4, h: 0.2,
    fontFace: theme.body, fontSize: 9, color: theme.muted, align: "right", margin: 0,
  });
}

module.exports = { makeShadow, titleBar, footer };
