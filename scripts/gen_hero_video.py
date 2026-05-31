#!/usr/bin/env python3
"""
Generate ORIGINAL hero/product video assets for the InvoiceChase landing page.

Everything is drawn programmatically with Pillow from the site's own mk-* brand
tokens — no web/stock footage. Frames are encoded to MP4 (H.264) + WebM (VP9)
with the ffmpeg binary bundled by the `imageio-ffmpeg` pip package.

Loop is seamless because frame 0 and the final frame are both the bare ink
background (fade-in at head, fade-out at tail).
"""
import math
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont, ImageFilter

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# ── Brand palette (from app/globals.css) ────────────────────────────────────
INK_950 = (0x0B, 0x0F, 0x12)
INK_800 = (0x1B, 0x20, 0x25)
INK_700 = (0x3A, 0x40, 0x47)
INK_500 = (0x6B, 0x71, 0x78)
INK_300 = (0xD7, 0xD3, 0xCD)
INK_100 = (0xF2, 0xEF, 0xEA)
INK_50 = (0xFB, 0xFA, 0xF7)
SURFACE = (0xFF, 0xFF, 0xFF)
PRIMARY_500 = (0xD1, 0x4A, 0x1F)
PRIMARY_600 = (0xB2, 0x3E, 0x18)
PRIMARY_100 = (0xF9, 0xDD, 0xCC)
PRIMARY_50 = (0xFD, 0xF1, 0xEB)
ACCENT_500 = (0x0E, 0x52, 0x40)
ACCENT_50 = (0xE7, 0xF1, 0xED)
# Status colors (standard semantics, harmonized with the palette)
GREEN = (0x0E, 0x52, 0x40)   # paid / low risk  (mk-accent-500)
GREEN_50 = (0xE7, 0xF1, 0xED)
AMBER = (0xC2, 0x7A, 0x12)   # medium risk
AMBER_50 = (0xF7, 0xEC, 0xD7)
RED = (0xC0, 0x34, 0x2B)     # overdue / high risk
RED_50 = (0xF7, 0xE2, 0xDF)

FONT_DIR = "/usr/share/fonts/truetype/liberation"
MONO_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

FPS = 24
DURATION_S = 10
N_FRAMES = FPS * DURATION_S  # 240

# ── helpers ─────────────────────────────────────────────────────────────────
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = clamp(t)
    return 0.5 * (1 - math.cos(math.pi * t))


def seg(f, a, b):
    """Normalized progress of frame f across the [a, b] frame window."""
    if f <= a:
        return 0.0
    if f >= b:
        return 1.0
    return (f - a) / (b - a)


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    t = clamp(t)
    return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(3))


def fmt_money(cents):
    return "${:,.0f}".format(cents / 100.0)


class Fonts:
    def __init__(self, s):
        def L(name, px):
            return ImageFont.truetype(os.path.join(FONT_DIR, name), max(8, int(px * s)))

        def M(px):
            return ImageFont.truetype(MONO_PATH, max(8, int(px * s)))

        self.reg = lambda px: L("LiberationSans-Regular.ttf", px)
        self.bold = lambda px: L("LiberationSans-Bold.ttf", px)
        self.mono = M


def shadow_card(base, box, radius, blur, alpha, s):
    """Soft drop shadow behind a rounded card."""
    x0, y0, x1, y1 = box
    pad = int(blur * 2)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(
        [x0, y0 + int(6 * s), x1, y1 + int(10 * s)],
        radius=radius,
        fill=(0, 0, 0, alpha),
    )
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def rrect(d, box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_center(d, cx, cy, s_text, font, fill):
    bb = d.textbbox((0, 0), s_text, font=font)
    w = bb[2] - bb[0]
    h = bb[3] - bb[1]
    d.text((cx - w / 2 - bb[0], cy - h / 2 - bb[1]), s_text, font=font, fill=fill)


def text_right(d, rx, y, s_text, font, fill):
    bb = d.textbbox((0, 0), s_text, font=font)
    w = bb[2] - bb[0]
    d.text((rx - w - bb[0], y), s_text, font=font, fill=fill)


# ── the scene ───────────────────────────────────────────────────────────────
CUSTOMERS = [
    # (name, initials, invoice, amount_cents, risk_start, risk_end, flips)
    ("Maria Alvarez", "MA", "#1042", 124000, "high", "low", True),
    ("Delgado Roofing", "DR", "#1038", 86500, "med", "med", False),
    ("Sunrise Cafe", "SC", "#1051", 32000, "low", "low", False),
]


def render_frame(f, W, H, fonts, s):
    """Render a single frame index f at resolution W x H (scale factor s)."""
    img = Image.new("RGBA", (W, H), INK_950 + (255,))
    # subtle warm vignette top-left -> keeps it from feeling flat but stays cheap
    d = ImageDraw.Draw(img)

    # global fade (seamless loop): black at head & tail
    fade_in = seg(f, 0, 16)
    fade_out = 1.0 - seg(f, N_FRAMES - 18, N_FRAMES - 1)
    galpha = clamp(min(ease_out(fade_in), ease_out(fade_out)))

    content = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(content)

    # ── card geometry ──
    cx0, cy0 = int(140 * s), int(78 * s)
    cx1, cy1 = int(W - 140 * s), int(H - 64 * s)
    rad = int(26 * s)
    rise = (1 - ease_out(seg(f, 6, 30))) * int(40 * s)
    box = [cx0, int(cy0 + rise), cx1, int(cy1 + rise)]

    shadow_card(content, box, rad, int(34 * s), 120, s)
    rrect(cd, box, rad, fill=SURFACE + (255,))

    inner_l = box[0] + int(40 * s)
    inner_r = box[2] - int(40 * s)
    top = box[1]

    # ── header row ──
    cd.ellipse(
        [inner_l, top + int(34 * s), inner_l + int(12 * s), top + int(46 * s)],
        fill=GREEN + (255,),
    )
    cd.text(
        (inner_l + int(22 * s), top + int(30 * s)),
        "Rivera Plumbing & Heating",
        font=fonts.bold(26),
        fill=INK_950 + (255,),
    )
    pill_w, pill_h = int(150 * s), int(30 * s)
    pill_box = [inner_r - pill_w, top + int(30 * s), inner_r, top + int(30 * s) + pill_h]
    rrect(cd, pill_box, pill_h // 2, fill=GREEN_50 + (255,))
    text_center(
        cd,
        (pill_box[0] + pill_box[2]) / 2,
        (pill_box[1] + pill_box[3]) / 2,
        "LIVE · SYNCED",
        fonts.bold(12),
        GREEN,
    )
    cd.line(
        [inner_l, top + int(86 * s), inner_r, top + int(86 * s)],
        fill=INK_300 + (255,),
        width=max(1, int(1 * s)),
    )

    # ── metrics ──
    my = top + int(112 * s)
    cd.text((inner_l, my), "RECOVERED THIS MONTH", font=fonts.bold(13), fill=INK_500 + (255,))
    recovered = ease_out(seg(f, 24, 150)) * 4825000  # up to $48,250.00
    cd.text(
        (inner_l, my + int(20 * s)),
        fmt_money(recovered),
        font=fonts.mono(50),
        fill=PRIMARY_500 + (255,),
    )

    # DSO block (right of metrics)
    dso_x = inner_l + int(430 * s)
    cd.text((dso_x, my), "DAYS SALES OUTSTANDING", font=fonts.bold(13), fill=INK_500 + (255,))
    dso = round(lerp(41, 19, ease_out(seg(f, 40, 155))))
    cd.text((dso_x, my + int(20 * s)), "41", font=fonts.mono(34), fill=INK_300 + (255,))
    aw = cd.textbbox((0, 0), "41", font=fonts.mono(34))
    cd.text(
        (dso_x + (aw[2] - aw[0]) + int(14 * s), my + int(22 * s)),
        "→",
        font=fonts.bold(28),
        fill=INK_500 + (255,),
    )
    cd.text(
        (dso_x + (aw[2] - aw[0]) + int(54 * s), my + int(20 * s)),
        f"{dso}",
        font=fonts.mono(34),
        fill=GREEN + (255,),
    )
    cd.text(
        (dso_x + (aw[2] - aw[0]) + int(108 * s), my + int(30 * s)),
        "days",
        font=fonts.reg(18),
        fill=INK_500 + (255,),
    )

    # ── customer rows ──
    row_y = my + int(110 * s)
    row_h = int(72 * s)
    row_gap = int(14 * s)
    for i, (name, initials, inv, amt, rs, re_, flips) in enumerate(CUSTOMERS):
        appear = ease_out(seg(f, 34 + i * 9, 64 + i * 9))
        ry = int(row_y + i * (row_h + row_gap) + (1 - appear) * int(20 * s))
        ralpha = int(255 * appear)
        rbox = [inner_l, ry, inner_r, ry + row_h]

        # paid sweep for the flipping row
        paid_t = ease_in_out(seg(f, 120, 142)) if flips else 0.0
        row_fill = mix(INK_50, GREEN_50, paid_t)
        rrect(cd, rbox, int(14 * s), fill=row_fill + (ralpha,))

        # avatar
        av = int(44 * s)
        ax0 = inner_l + int(16 * s)
        ay0 = ry + (row_h - av) // 2
        avatar_col = mix(PRIMARY_100, GREEN, paid_t) if flips else PRIMARY_100
        cd.ellipse([ax0, ay0, ax0 + av, ay0 + av], fill=avatar_col + (ralpha,))
        text_center(
            cd, ax0 + av / 2, ay0 + av / 2, initials, fonts.bold(15),
            (mix(PRIMARY_600, SURFACE, paid_t) if flips else PRIMARY_600),
        )

        # name + invoice
        tx = ax0 + av + int(16 * s)
        cd.text((tx, ry + int(14 * s)), name, font=fonts.bold(18), fill=INK_950 + (ralpha,))
        cd.text(
            (tx, ry + int(40 * s)),
            f"Invoice {inv}",
            font=fonts.reg(14),
            fill=INK_500 + (ralpha,),
        )

        # amount (mono, right aligned-ish in the middle-right)
        amt_x = inner_r - int(360 * s)
        cd.text(
            (amt_x, ry + int(24 * s)),
            fmt_money(amt),
            font=fonts.mono(22),
            fill=INK_800 + (ralpha,),
        )

        # risk badge
        if flips:
            rt = ease_in_out(seg(f, 108, 140))
            badge_col = mix(RED, GREEN, rt)
            badge_bg = mix(RED_50, GREEN_50, rt)
            risk_label = "LOW RISK" if rt > 0.5 else "HIGH RISK"
        else:
            cmap = {"low": (GREEN, GREEN_50, "LOW RISK"),
                    "med": (AMBER, AMBER_50, "MEDIUM"),
                    "high": (RED, RED_50, "HIGH RISK")}
            badge_col, badge_bg, risk_label = cmap[rs]
        bw, bh = int(108 * s), int(28 * s)
        bx0 = inner_r - int(230 * s)
        by0 = ry + (row_h - bh) // 2
        rrect(cd, [bx0, by0, bx0 + bw, by0 + bh], bh // 2, fill=badge_bg + (ralpha,))
        text_center(cd, bx0 + bw / 2, by0 + bh / 2, risk_label, fonts.bold(12), badge_col)

        # status pill (OVERDUE -> PAID for the flipping row)
        sw, sh = int(96 * s), int(34 * s)
        sx0 = inner_r - sw
        sy0 = ry + (row_h - sh) // 2
        if flips:
            st = ease_in_out(seg(f, 122, 140))
            s_bg = mix(RED, GREEN, st)
            s_label = "PAID" if st > 0.5 else "OVERDUE"
        else:
            s_bg = AMBER if rs == "med" else (RED if rs == "high" else GREEN)
            s_label = "DUE" if rs != "high" else "OVERDUE"
        rrect(cd, [sx0, sy0, sx0 + sw, sy0 + sh], sh // 2, fill=s_bg + (ralpha,))
        lab_font = fonts.bold(13)
        if flips and ease_in_out(seg(f, 122, 140)) > 0.5:
            # checkmark + PAID
            chk = "✓ PAID"
            text_center(cd, sx0 + sw / 2, sy0 + sh / 2, chk, lab_font, SURFACE)
        else:
            text_center(cd, sx0 + sw / 2, sy0 + sh / 2, s_label, lab_font, SURFACE)

    # ── Fast-Pay SMS card (slides up from bottom-right) ──
    sms_in = ease_out(seg(f, 92, 116))
    sms_out = 1.0 - ease_in_out(seg(f, 206, 224))
    sms_a = clamp(min(sms_in, sms_out))
    if sms_a > 0.01:
        pw, ph = int(300 * s), int(176 * s)
        px1 = box[2] - int(26 * s)
        py1 = box[3] - int(26 * s)
        slide = (1 - sms_a) * int(40 * s)
        pbox = [px1 - pw, int(py1 - ph + slide), px1, int(py1 + slide)]
        a = int(255 * sms_a)
        # phone-ish card
        sh_layer = Image.new("RGBA", content.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh_layer)
        sd.rounded_rectangle(
            [pbox[0], pbox[1] + int(6 * s), pbox[2], pbox[3] + int(8 * s)],
            radius=int(20 * s), fill=(0, 0, 0, int(90 * sms_a)),
        )
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(int(18 * s)))
        content.alpha_composite(sh_layer)
        rrect(cd, pbox, int(20 * s), fill=INK_950 + (a,))
        # header
        cd.text(
            (pbox[0] + int(16 * s), pbox[1] + int(12 * s)),
            "Fast-Pay SMS",
            font=fonts.bold(13),
            fill=(255, 255, 255, a),
        )
        cd.ellipse(
            [pbox[2] - int(26 * s), pbox[1] + int(14 * s),
             pbox[2] - int(16 * s), pbox[1] + int(24 * s)],
            fill=GREEN + (a,),
        )
        # incoming bubble
        bub = [pbox[0] + int(16 * s), pbox[1] + int(40 * s),
               pbox[2] - int(40 * s), pbox[1] + int(96 * s)]
        rrect(cd, bub, int(14 * s), fill=(255, 255, 255, a))
        cd.text(
            (bub[0] + int(12 * s), bub[1] + int(9 * s)),
            "Hi Maria — your $1,240",
            font=fonts.reg(13), fill=INK_800 + (a,),
        )
        cd.text(
            (bub[0] + int(12 * s), bub[1] + int(28 * s)),
            "invoice. Tap to pay ↓",
            font=fonts.reg(13), fill=INK_800 + (a,),
        )
        # pay button -> becomes Paid
        paid_btn = ease_in_out(seg(f, 158, 178))
        btn = [pbox[0] + int(16 * s), pbox[3] - int(50 * s),
               pbox[2] - int(16 * s), pbox[3] - int(14 * s)]
        bcol = mix(PRIMARY_500, GREEN, paid_btn)
        rrect(cd, btn, int(12 * s), fill=bcol + (a,))
        label = "✓ Paid $1,240" if paid_btn > 0.5 else "Pay $1,240 now"
        text_center(cd, (btn[0] + btn[2]) / 2, (btn[1] + btn[3]) / 2,
                    label, fonts.bold(15), (255, 255, 255, a))

    # composite content with global fade onto ink background
    if galpha < 1.0:
        content = Image.eval(content, lambda v: v)  # no-op keep
        alpha = content.split()[3].point(lambda v: int(v * galpha))
        content.putalpha(alpha)
    img.alpha_composite(content)
    return img.convert("RGB")


def render_set(W, H, outdir, s):
    if os.path.exists(outdir):
        shutil.rmtree(outdir)
    os.makedirs(outdir)
    fonts = Fonts(s)
    for f in range(N_FRAMES):
        frame = render_frame(f, W, H, fonts, s)
        frame.save(os.path.join(outdir, f"f{f:04d}.png"))
    return outdir


def encode_mp4(frames_dir, out, vbitrate):
    log = "/tmp/x264pass"
    common_in = ["-y", "-framerate", str(FPS), "-i", os.path.join(frames_dir, "f%04d.png"), "-an"]
    # NOTE: -preset must be identical across both passes (it changes bframes etc).
    preset = ["-preset", "veryslow"]
    subprocess.run(
        [FFMPEG, *common_in, "-c:v", "libx264", "-b:v", vbitrate, *preset, "-pass", "1",
         "-passlogfile", log, "-pix_fmt", "yuv420p", "-f", "mp4", os.devnull],
        check=True, capture_output=True,
    )
    subprocess.run(
        [FFMPEG, *common_in, "-c:v", "libx264", "-b:v", vbitrate, *preset, "-pass", "2",
         "-passlogfile", log, "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", out],
        check=True, capture_output=True,
    )


def encode_webm(frames_dir, out, vbitrate):
    log = "/tmp/vp9pass"
    common_in = ["-y", "-framerate", str(FPS), "-i", os.path.join(frames_dir, "f%04d.png"), "-an"]
    subprocess.run(
        [FFMPEG, *common_in, "-c:v", "libvpx-vp9", "-b:v", vbitrate, "-pass", "1",
         "-passlogfile", log, "-f", "null", os.devnull],
        check=True, capture_output=True,
    )
    subprocess.run(
        [FFMPEG, *common_in, "-c:v", "libvpx-vp9", "-b:v", vbitrate, "-pass", "2",
         "-passlogfile", log, "-pix_fmt", "yuv420p", out],
        check=True, capture_output=True,
    )


def main():
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "hero")
    os.makedirs(out, exist_ok=True)

    # Desktop 1280x720
    dd = render_set(1280, 720, "/tmp/frames_desktop", 1.0)
    encode_mp4(dd, os.path.join(out, "hero-desktop.mp4"), "1250k")
    encode_webm(dd, os.path.join(out, "hero-desktop.webm"), "950k")

    # Mobile 640x360
    md = render_set(640, 360, "/tmp/frames_mobile", 0.5)
    encode_mp4(md, os.path.join(out, "hero-mobile.mp4"), "650k")
    encode_webm(md, os.path.join(out, "hero-mobile.webm"), "480k")

    # Poster (the "after" hero beat) — WebP + JPEG, both <=150KB
    fonts = Fonts(1.0)
    poster = render_frame(150, 1280, 720, fonts, 1.0)
    poster.save(os.path.join(out, "hero-poster.webp"), "WEBP", quality=82, method=6)
    poster.save(os.path.join(out, "hero-poster.jpg"), "JPEG", quality=84, optimize=True, progressive=True)

    print("done ->", out)


if __name__ == "__main__":
    main()
