#!/usr/bin/env python3
"""Build the print-safe A4 edition of the Factory run map."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph, Table, TableStyle


PAGE_W, PAGE_H = A4
MARGIN = 16 * mm

INK = HexColor("#17191D")
MUTED = HexColor("#626975")
RULE = HexColor("#D4D1C9")
PAPER = HexColor("#FAF9F5")
BLUE = HexColor("#1557FF")
PINK = HexColor("#EF3A8B")
GREEN = HexColor("#197A4A")
YELLOW = HexColor("#F2D52C")
PURPLE = HexColor("#7752B9")
BLUE_LIGHT = HexColor("#E8EEFF")
PINK_LIGHT = HexColor("#FDEAF2")
GREEN_LIGHT = HexColor("#E7F3ED")
YELLOW_LIGHT = HexColor("#FFF6C9")
PURPLE_LIGHT = HexColor("#F0EBFA")


def wrap_lines(text: str, font: str, size: float, width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and stringWidth(candidate, font, size) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    c: Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    *,
    font: str = "Helvetica",
    size: float = 9,
    leading: float | None = None,
    color=INK,
    max_lines: int | None = None,
) -> float:
    leading = leading or size * 1.25
    lines = wrap_lines(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def page_header(c: Canvas, page: int, section: str) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setStrokeColor(RULE)
    c.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    c.setFillColor(MUTED)
    c.setFont("Courier-Bold", 7.5)
    c.drawString(MARGIN, PAGE_H - 10 * mm, "FACTORY RUN FLOW")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 10 * mm, section.upper())
    c.line(MARGIN, 13 * mm, PAGE_W - MARGIN, 13 * mm)
    c.drawString(MARGIN, 8.5 * mm, "factory.olegkoval.com")
    c.drawRightString(PAGE_W - MARGIN, 8.5 * mm, f"{page} / 4")


def section_label(c: Canvas, text: str, x: float, y: float, color=MUTED) -> None:
    c.setFillColor(color)
    c.setFont("Courier-Bold", 7.2)
    c.drawString(x, y, text.upper())


def draw_box(
    c: Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    subtitle: str = "",
    *,
    fill=BLUE_LIGHT,
    stroke=BLUE,
    title_size: float = 8,
) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.85)
    c.roundRect(x, y, w, h, 3, stroke=1, fill=1)
    title_lines = wrap_lines(title, "Helvetica-Bold", title_size, w - 12)
    subtitle_lines = wrap_lines(subtitle, "Courier", 6.2, w - 12) if subtitle else []
    total_h = len(title_lines) * (title_size + 1) + len(subtitle_lines) * 7
    ty = y + (h + total_h) / 2 - title_size
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", title_size)
    for line in title_lines:
        c.drawCentredString(x + w / 2, ty, line)
        ty -= title_size + 1
    if subtitle_lines:
        ty -= 1
        c.setFillColor(MUTED)
        c.setFont("Courier", 6.2)
        for line in subtitle_lines:
            c.drawCentredString(x + w / 2, ty, line)
            ty -= 7


def draw_diamond(c: Canvas, cx: float, cy: float, w: float, h: float, text: str) -> None:
    path = c.beginPath()
    path.moveTo(cx, cy + h / 2)
    path.lineTo(cx + w / 2, cy)
    path.lineTo(cx, cy - h / 2)
    path.lineTo(cx - w / 2, cy)
    path.close()
    c.setFillColor(YELLOW_LIGHT)
    c.setStrokeColor(HexColor("#B57900"))
    c.setLineWidth(0.85)
    c.drawPath(path, stroke=1, fill=1)
    lines = wrap_lines(text, "Courier", 6.2, w * 0.62)
    ty = cy + ((len(lines) - 1) * 3.5)
    c.setFillColor(INK)
    c.setFont("Courier", 6.2)
    for line in lines:
        c.drawCentredString(cx, ty, line)
        ty -= 7


def arrow(c: Canvas, x1: float, y1: float, x2: float, y2: float, label: str = "") -> None:
    c.setStrokeColor(HexColor("#8C857A"))
    c.setFillColor(HexColor("#8C857A"))
    c.setLineWidth(0.65)
    c.line(x1, y1, x2, y2)
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 4.5
    for delta in (2.6, -2.6):
        c.line(
            x2,
            y2,
            x2 - length * math.cos(angle + math.radians(delta * 8)),
            y2 - length * math.sin(angle + math.radians(delta * 8)),
        )
    if label:
        c.setFillColor(MUTED)
        c.setFont("Courier", 5.8)
        c.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 3, label)


def draw_pill(c: Canvas, cx: float, cy: float, text: str, *, fill=PAPER, stroke=INK) -> None:
    width = max(48, stringWidth(text, "Courier", 6.5) + 16)
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(cx - width / 2, cy - 9, width, 18, 9, stroke=1, fill=1)
    c.setFillColor(INK)
    c.setFont("Courier", 6.5)
    c.drawCentredString(cx, cy - 2.2, text)


def page_one(c: Canvas) -> None:
    page_header(c, 1, "Read this first")
    y = PAGE_H - 31 * mm
    section_label(c, "One ticket in / one verified draft PR out", MARGIN, y)
    y -= 15 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(MARGIN, y, "Factory Run Flow")
    y -= 9 * mm
    y = draw_wrapped(
        c,
        "One phase per fresh session. Each phase is gated before the next begins. The run stops whenever a human decision is required, and state.json is the only record carried between sessions.",
        MARGIN,
        y,
        PAGE_W - 2 * MARGIN,
        size=11,
        leading=15,
        color=MUTED,
    )

    y -= 13 * mm
    card_gap = 4 * mm
    card_w = (PAGE_W - 2 * MARGIN - 3 * card_gap) / 4
    stages = [
        ("01", "Understand", "0 / 0b / 1", BLUE, BLUE_LIGHT),
        ("02", "Decide", "2 / 2b", PINK, PINK_LIGHT),
        ("03", "Build", "3 / 4", YELLOW, YELLOW_LIGHT),
        ("04", "Prove", "5 / 6", GREEN, GREEN_LIGHT),
    ]
    for index, (number, title, phase_ids, accent, fill) in enumerate(stages):
        x = MARGIN + index * (card_w + card_gap)
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.roundRect(x, y - 41 * mm, card_w, 41 * mm, 4, stroke=1, fill=1)
        c.setFillColor(accent)
        c.rect(x, y - 3, card_w, 3, stroke=0, fill=1)
        c.setFillColor(MUTED)
        c.setFont("Courier-Bold", 7)
        c.drawString(x + 8, y - 12, number)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x + 8, y - 31, title)
        c.setFillColor(MUTED)
        c.setFont("Courier", 7)
        c.drawString(x + 8, y - 46, phase_ids)
        descriptions = [
            "Evidence, isolation, root cause",
            "Human plan, questions closed",
            "Equivalent plan, bounded milestones",
            "Whole-change proof, terminal gate",
        ]
        draw_wrapped(c, descriptions[index], x + 8, y - 67, card_w - 16, size=7.4, leading=9, color=MUTED)

    y -= 57 * mm
    section_label(c, "Operating contract", MARGIN, y)
    y -= 8 * mm
    rules = [
        ("01", "Fresh context", "The phase starts in a new session. Chat history is not treated as durable state."),
        ("02", "Persistent evidence", "Only state.json and committed artifacts cross the session boundary."),
        ("03", "Executable gates", "A phase closes only when gate.py permits it. A failed predecessor blocks the next phase."),
    ]
    row_h = 25 * mm
    for number, title, body in rules:
        c.setStrokeColor(RULE)
        c.line(MARGIN, y, PAGE_W - MARGIN, y)
        c.setFillColor(INK)
        c.setFont("Courier-Bold", 8)
        c.drawString(MARGIN, y - 12, number)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN + 14 * mm, y - 13, title)
        draw_wrapped(c, body, MARGIN + 62 * mm, y - 12, PAGE_W - MARGIN - (MARGIN + 62 * mm), size=8.3, leading=10.5, color=MUTED)
        y -= row_h
    c.line(MARGIN, y, PAGE_W - MARGIN, y)

    y -= 13 * mm
    section_label(c, "Legend", MARGIN, y)
    y -= 9 * mm
    legend = [
        (BLUE, "Autonomous phase"),
        (PINK, "Needs you"),
        (GREEN, "Leaf agents"),
        (YELLOW, "Executable gate"),
        (PURPLE, "Terminal state"),
    ]
    x = MARGIN
    for color, label in legend:
        c.setFillColor(color)
        c.rect(x, y - 7, 7, 7, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Courier", 6.6)
        c.drawString(x + 11, y - 6.2, label)
        x += stringWidth(label, "Courier", 6.6) + 25

    y = 52 * mm
    c.setFillColor(INK)
    c.roundRect(MARGIN, y - 26 * mm, PAGE_W - 2 * MARGIN, 26 * mm, 4, stroke=0, fill=1)
    c.setFillColor(PAPER)
    c.setFont("Courier-Bold", 8)
    c.drawString(MARGIN + 12, y - 15, "RUN ONE PHASE")
    c.setFont("Courier", 13)
    c.drawString(MARGIN + 12, y - 35, "scripts/run.sh <slug>")
    c.setFillColor(HexColor("#B8B8B2"))
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN - 12, y - 35, "Pages 2-3: flow / Page 4: roles and stop conditions")


def page_two(c: Canvas) -> None:
    page_header(c, 2, "Phases 0 to 2b")
    cx = PAGE_W / 2
    x0 = cx - 54
    w = 108
    box_h = 34

    section_label(c, "Part 1 / Understand and decide", MARGIN, PAGE_H - 23 * mm)
    draw_pill(c, cx, 744, "ticket, Sentry URL, or text")

    arrow(c, cx, 735, cx, 714)
    draw_box(c, x0, 678, w, box_h, "0  Intake", "triage at light or full depth")
    arrow(c, cx, 678, cx, 654)
    draw_diamond(c, cx, 636, 78, 36, "gate 0 / intake.md")
    arrow(c, cx, 618, cx, 596)
    draw_box(c, x0, 560, w, box_h, "0b  Isolate", "worktree + branch + baseline SHA")
    arrow(c, cx, 560, cx, 538)
    draw_diamond(c, cx, 520, 78, 36, "worktree possible?")

    draw_box(c, 418, 502, 128, 38, "Ask before in-place work", "record isolation.accepted_by", fill=PINK_LIGHT, stroke=PINK, title_size=7.3)
    arrow(c, cx + 39, 520, 418, 521, "no")
    draw_pill(c, 482, 474, "decline -> blocked", fill=PURPLE_LIGHT, stroke=PURPLE)
    arrow(c, 482, 502, 482, 483, "stop")

    arrow(c, cx, 502, cx, 480, "yes")
    draw_diamond(c, cx, 462, 90, 36, "gate 0b / isolation + baseline")

    draw_box(c, 78, 397, 122, 42, "1  Diagnosis", "reproduce + root cause", fill=BLUE_LIGHT, stroke=BLUE)
    draw_box(c, 33, 343, 110, 31, "Leaf reproduction", "max 2 tries", fill=GREEN_LIGHT, stroke=GREEN, title_size=7.2)
    draw_diamond(c, 201, 354, 74, 32, "gate 1 / diagnosis.md")
    arrow(c, cx - 44, 462, 139, 439, "full")
    arrow(c, 139, 397, 139, 374)
    arrow(c, 200, 418, 201, 370)

    draw_box(c, x0, 285, w, 44, "2  Human plan", "changes + ACs + flag key + questions", fill=PINK_LIGHT, stroke=PINK, title_size=7.8)
    arrow(c, cx, 444, cx, 329, "light")
    arrow(c, 201, 338, cx - 40, 307, "pass")
    draw_box(c, 39, 286, 118, 34, "Review the rediff", "annotate until clean", fill=PINK_LIGHT, stroke=PINK, title_size=7.2)
    arrow(c, 157, 303, x0, 307)

    arrow(c, cx, 285, cx, 257)
    draw_diamond(c, cx, 239, 78, 36, "gate 2 / Flag key")
    arrow(c, cx, 221, cx, 199)
    draw_box(c, x0, 155, w, 44, "2b  Grill", "one question per round / max 3", fill=PINK_LIGHT, stroke=PINK, title_size=7.8)
    draw_box(c, 43, 160, 116, 34, "One leaf per round", "facts only", fill=GREEN_LIGHT, stroke=GREEN, title_size=7.2)
    arrow(c, 159, 177, x0, 177)

    arrow(c, cx, 155, cx, 132)
    draw_diamond(c, cx, 122, 90, 40, "blocking questions open?")
    draw_pill(c, 475, 121, "rounds exhausted -> blocked", fill=PURPLE_LIGHT, stroke=PURPLE)
    arrow(c, cx + 45, 122, 411, 122, "yes / cap")
    arrow(c, cx, 102, cx, 98, "none")
    draw_diamond(c, cx, 82, 88, 32, "gate 2b / answers + cap")
    draw_pill(c, cx, 50, "continue on page 3", fill=PAPER, stroke=INK)
    arrow(c, cx, 66, cx, 59)


def page_three(c: Canvas) -> None:
    page_header(c, 3, "Phases 3 to 6")
    cx = PAGE_W / 2
    x0 = cx - 58
    w = 116

    section_label(c, "Part 2 / Build and prove", MARGIN, PAGE_H - 23 * mm)
    draw_pill(c, cx, 748, "gate 2b passed / blocking frontier empty", fill=PAPER, stroke=INK)
    arrow(c, cx, 739, cx, 716)
    draw_box(c, x0, 677, w, 38, "3  Agent plan", "M1..Mn + invariants + tracer", fill=BLUE_LIGHT, stroke=BLUE)
    draw_box(c, 50, 676, 128, 38, "Plan-equivalence auditor", "SAME-SCOPE or one retry", fill=GREEN_LIGHT, stroke=GREEN, title_size=7.1)
    arrow(c, 178, 695, x0, 695)
    arrow(c, cx, 677, cx, 653)
    draw_diamond(c, cx, 635, 88, 36, "gate 3 / invariants + M1 + tracer")
    arrow(c, cx, 617, cx, 593)
    draw_box(c, x0, 553, w, 38, "4  Milestones", "one milestone per fresh session", fill=BLUE_LIGHT, stroke=BLUE)

    leaf_y = 489
    leaf_w = 112
    for x, title, subtitle in [
        (34, "E2E tester", "writes failing tests"),
        (178, "Implementer / fixer", "max 2 rounds"),
        (322, "Milestone reviewer", "skipped at light depth"),
    ]:
        draw_box(c, x, leaf_y, leaf_w, 34, title, subtitle, fill=GREEN_LIGHT, stroke=GREEN, title_size=7)
        arrow(c, cx, 553, x + leaf_w / 2, leaf_y + 34)

    draw_diamond(c, cx, 446, 92, 40, "gate 4 / milestone done + SHA")
    arrow(c, cx, 489, cx, 466)
    c.setStrokeColor(HexColor("#8C857A"))
    c.setLineWidth(0.65)
    c.line(cx + 46, 446, 490, 446)
    c.line(490, 446, 490, 572)
    c.line(490, 572, x0 + w, 572)
    section_label(c, "fix or more milestones", 421, 453, MUTED)

    arrow(c, cx, 426, cx, 402, "all done")
    draw_box(c, x0, 362, w, 38, "5  Proof", "change scan + callers + AC matrix", fill=BLUE_LIGHT, stroke=BLUE)
    draw_box(c, 44, 304, 128, 36, "Whole-change reviewer", "PASS or FIX", fill=GREEN_LIGHT, stroke=GREEN, title_size=7)
    draw_box(c, 422, 304, 128, 36, "Invariant reviewers", "max 4 leaves / 2 concurrent", fill=GREEN_LIGHT, stroke=GREEN, title_size=7)
    arrow(c, cx, 362, 108, 340)
    arrow(c, cx, 362, 486, 340)
    arrow(c, cx, 362, cx, 326)
    draw_diamond(c, cx, 306, 88, 40, "gate 5 / scan + matrix rows")

    arrow(c, cx, 286, cx, 260, "pass")
    draw_box(c, x0, 216, w, 42, "6  Stop and report", "tokens + sessions + draft PR URL", fill=PINK_LIGHT, stroke=PINK)
    arrow(c, cx, 216, cx, 188)
    draw_diamond(c, cx, 167, 84, 42, "terminal state")

    outcomes = [
        (94, "delivered", GREEN_LIGHT, GREEN),
        (246, "delivered-with-gaps", PURPLE_LIGHT, PURPLE),
        (407, "intentionally-unchanged", PURPLE_LIGHT, PURPLE),
    ]
    for x, label, fill, stroke in outcomes:
        draw_pill(c, x, 103, label, fill=fill, stroke=stroke)
        arrow(c, cx, 146, x, 114)
    draw_pill(c, cx, 60, "blocked / report names what and who", fill=PINK_LIGHT, stroke=PINK)
    arrow(c, cx, 146, cx, 69)


def make_paragraph(text: str, *, bold: bool = False, mono: bool = False, size: float = 7.5):
    font = "Courier-Bold" if mono and bold else "Courier" if mono else "Helvetica-Bold" if bold else "Helvetica"
    return Paragraph(
        text,
        ParagraphStyle(
            "table-cell",
            fontName=font,
            fontSize=size,
            leading=size * 1.3,
            textColor=INK,
            alignment=TA_LEFT,
        ),
    )


def page_four(c: Canvas) -> None:
    page_header(c, 4, "Roles and stop conditions")
    y = PAGE_H - 25 * mm
    section_label(c, "Who does what, per phase", MARGIN, y)
    y -= 7 * mm
    role_rows = [
        ["Phase", "Runs as", "Speaks", "Closes when"],
        ["0 intake", "opus", "triage verdict", "intake.md written"],
        ["0b isolate", "sonnet", "where the run writes", "worktree + baseline SHA, or consent to in-place"],
        ["1 diagnosis", "opus", "root-cause synthesis", "diagnosis.md; skipped at light depth"],
        ["2 human plan", "you", "plan + rediff", "plan has a Flag key line"],
        ["2b grill", "you + leaf", "one summary per round", "no blocking question unanswered"],
        ["3 agent plan", "opus", "gate decision", "invariants, M1 tracer, SAME-SCOPE"],
        ["4 milestones", "opus + leaves", "per-milestone verdict", "every milestone done with a SHA"],
        ["5 proof", "opus + leaves", "Phase 5 verdict", "scan + AC matrix + reviewer PASS"],
        ["6 stop", "you", "final report + PR URL", "terminal state set, gate quoted"],
    ]
    role_data = [[make_paragraph(cell, bold=row_index == 0, mono=column_index < 2, size=7.1) for column_index, cell in enumerate(row)] for row_index, row in enumerate(role_rows)]
    role_table = Table(role_data, colWidths=[30 * mm, 28 * mm, 44 * mm, 75 * mm], repeatRows=1)
    role_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#ECEAE4")),
        ("GRID", (0, 0), (-1, -1), 0.45, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (1, 4), (1, 5), PINK_LIGHT),
        ("BACKGROUND", (1, 8), (1, 8), GREEN_LIGHT),
        ("BACKGROUND", (1, 9), (1, 9), PINK_LIGHT),
    ]))
    _, role_h = role_table.wrap(PAGE_W - 2 * MARGIN, y)
    role_table.drawOn(c, MARGIN, y - role_h)

    y = y - role_h - 12 * mm
    section_label(c, "What stops the loop", MARGIN, y)
    y -= 7 * mm
    stop_rows = [
        ["Signal", "run.sh does"],
        ["Next phase is 2, 2b, or 6", "Prints NEEDS-YOU, exit 0. Run /factory resume &lt;slug&gt;, then rerun."],
        ["Gate on the closed phase says BLOCKED", "Prints reasons, exit 1. Nothing starts on an unpassed predecessor."],
        ["state.terminal set", "Exit 0. The run is over."],
        ["sessions_used hits sessions_max", "Exit 0 with the cap named."],
        ["Two sessions change neither phase nor milestone", "Reruns the gate for the reasons, exit 1."],
        ["leaves_used > leaves_max", "Gate blocks. Only blocked may still close."],
    ]
    stop_data = [[make_paragraph(cell, bold=row_index == 0, mono=column_index == 0, size=7.1) for column_index, cell in enumerate(row)] for row_index, row in enumerate(stop_rows)]
    stop_table = Table(stop_data, colWidths=[70 * mm, 107 * mm], repeatRows=1)
    stop_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#ECEAE4")),
        ("GRID", (0, 0), (-1, -1), 0.45, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 2), (0, 2), YELLOW_LIGHT),
    ]))
    _, stop_h = stop_table.wrap(PAGE_W - 2 * MARGIN, y)
    stop_table.drawOn(c, MARGIN, y - stop_h)

    y = y - stop_h - 9 * mm
    c.setFillColor(INK)
    c.setFont("Courier", 7)
    c.drawString(MARGIN, y, "Default caps: sessions_max 16 / leaves_max 40")
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_W - MARGIN, y, "Override autonomous phase models with FACTORY_MODEL_<PHASE>")


def build(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    c = Canvas(str(output), pagesize=A4, pageCompression=1)
    c.setTitle("Factory Run Flow - Print Edition")
    c.setAuthor("Oleg Koval")
    c.setSubject("The complete Factory agent-delivery workflow, gates, roles, and stop conditions")
    c.setCreator("Factory")
    for draw_page in (page_one, page_two, page_three, page_four):
        draw_page(c)
        c.showPage()
    c.save()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("output/pdf/factory-run-flow-a4.pdf"),
    )
    args = parser.parse_args()
    build(args.output)
    print(args.output.resolve())


if __name__ == "__main__":
    main()
