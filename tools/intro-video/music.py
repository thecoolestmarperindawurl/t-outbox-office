# Nhạc nền tự tổng hợp cho video intro T-outbox (không dùng mẫu có bản quyền).
import numpy as np, wave, sys
SR = 44100; LEN = 39.6; BPM = 112; BEAT = 60 / BPM
N = int(SR * LEN); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, d, s=0.0, r=0.05):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4))
    return e * (s + (1 - s) * np.exp(-t / d)) * np.minimum(1, (n / SR - t) / r)
def add(sig, t, pan=0.0, g=1.0):
    i = int(t * SR); sig = sig[: max(0, N - i)]
    L[i:i + len(sig)] += sig * g * (1 - pan) * 0.5 ** 0.5 * 1.2
    R[i:i + len(sig)] += sig * g * (1 + pan) * 0.5 ** 0.5 * 1.2
def tone(f, dur, kind='sine', a=0.01, d=0.4, s=0.0, r=0.08, det=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t)
    if kind == 'tri': x = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t))
    if kind == 'pad': x = sum(np.sin(2 * np.pi * f * (1 + k) * t + k) for k in (-det, 0, det)) / 3 + 0.25 * np.sin(4 * np.pi * f * t)
    if kind == 'bell': x = np.sin(2 * np.pi * f * t + 1.8 * np.exp(-t * 6) * np.sin(2 * np.pi * f * 3.5 * t))
    return x * env(n, a, d, s, r)
# Hợp âm: C  G  Am  F (mỗi hợp âm 2 ô nhịp 4/4)
CH = [[48, 55, 60, 64, 67], [43, 55, 59, 62, 67], [45, 57, 60, 64, 69], [41, 53, 57, 60, 65]]
bar = 4 * BEAT
def level(t):  # đường năng lượng theo cảnh
    if t < 5: return 0.55
    if t < 35: return 1.0
    return 0.6
t = 0.0; k = 0
while t < LEN:
    c = CH[(k // 2) % 4]
    dur = 2 * bar
    for m in c[1:]: add(tone(note(m), dur + 0.6, 'pad', a=0.4, d=9, s=0.6, r=0.6, det=0.003), t, pan=rng.uniform(-.4, .4), g=0.05)
    add(tone(note(c[0] - 12 + 12), dur, 'tri', a=0.02, d=1.2, s=0.5, r=0.2), t, g=0.10 if t >= 5 else 0.05)
    # arpeggio tiếng chuông, 8 nốt mỗi ô nhịp
    arp = [c[2], c[3], c[4], c[3] + 12, c[4], c[3], c[2] + 12, c[4]]
    for b in range(16):
        tt = t + b * BEAT / 2
        if tt >= LEN - 0.6: break
        add(tone(note(arp[b % 8] + 12), 0.5, 'bell', a=0.003, d=0.18, r=0.05), tt, pan=0.35 * np.sin(b), g=0.07 * level(tt))
    t += dur; k += 1
# trống nhẹ từ cảnh 2 tới trước cảnh kết
def kick():
    n = int(0.3 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (48 + 90 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 11)
def hat():
    n = int(0.06 * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-np.arange(n) / SR * 70)
b = 0; tt = 5.0
while tt < 35.0:
    if b % 2 == 0: add(kick(), tt, g=0.32)
    add(hat(), tt + BEAT / 2, pan=0.3, g=0.05)
    tt += BEAT; b += 1
# hiệu ứng: pop khi nhân vật hiện, gõ phím, ding khi gửi, whoosh ở chỗ chuyển cảnh
pops = [0.5] + [1.3 + 0.12 * j for j in range(5)] + [2.2 + 0.1 * i for i in (0, 2, 4, 7, 9)]
for j, p in enumerate(sorted(pops)):
    n = int(0.12 * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * (500 + 700 * x / 0.12 + 40 * j) * x) * np.exp(-x * 30)
    add(s, p + 0.08, pan=-0.6 + 1.2 * j / len(pops), g=0.16)
for i in range(64):
    tk = 5.7 + i * (1.8 / 64) + rng.uniform(-0.008, 0.008)
    n = int(0.025 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 260)
    add(x, tk, pan=0.1, g=0.05)
add(tone(note(84), 1.0, 'bell', a=0.002, d=0.35), 7.9, g=0.2); add(tone(note(91), 1.0, 'bell', a=0.002, d=0.35), 8.0, g=0.14)
def whoosh(t0, dur=0.5, g=0.09):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); a = 0.0
    for i in range(n):  # lọc thông thấp có tần số cắt tăng dần
        cut = 0.02 + 0.25 * (i / n); a += cut * (x[i] - a); y[i] = a
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    add(y * e * 3, t0 - dur / 2, g=g)
for c in [5.0, 13.0, 15.0, 17.2, 19.2, 21.4, 23.5, 26.0, 29.0]: whoosh(c)
add(tone(note(72), 3.5, 'bell', a=0.003, d=1.2), 35.4, g=0.16); add(tone(note(79), 3.5, 'bell', a=0.003, d=1.2), 35.5, g=0.12); add(tone(note(84), 3.5, 'bell', a=0.003, d=1.2), 35.6, g=0.1)
# hồi âm đơn giản + chuẩn hoá + fade
for d, g in ((0.11, 0.25), (0.23, 0.16), (0.37, 0.1)):
    s = int(d * SR); L[s:] += R[:-s] * g; R[s:] += L[:-s] * g
tt = np.arange(N) / SR
fade = np.minimum(1, tt / 0.6) * np.minimum(1, (LEN - tt) / 2.2)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); L = np.tanh(L / peak * 1.1) * 0.89; R = np.tanh(R / peak * 1.1) * 0.89
out = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', LEN)
