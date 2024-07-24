#import "template.typ": *

#show: project.with(
  title: "マクスウェル方程式", 
  authors: (
    (name: "W",  affiliation: "W"), 
  ), 
)

#show heading: it => {
    it
    par(text(size: 0.5em,  ""))
}

#show figure: it => {
    it
    par(text(size: 0pt,  ""))
}

#show enum: it => {
    it
    par(text(size: 0pt,  ""))
}

#show link: underline

#show figure.where(
  kind: table
): set figure.caption(position: top)

= マクスウェル方程式

== 電場のガウスの法則

- 電束密度の発散は電荷密度.
- 電荷があれば, 電場が発散.
- $bold(D)$ は電束密度, $rho$ は電荷密度である.

$
  integral_S bold(D) dot bold(n) d S &= integral_V rho d V\
  integral_V nabla dot bold(D) d V &= integral_V rho d V\
  integral_V (nabla dot bold(D) - rho) d V &= 0\
  nabla dot bold(D) - rho &= 0\
  nabla dot bold(D) &= rho\
  "div" bold(D) &= rho
$

== 磁場のガウスの法則

- 磁束密度の発散は $0$.
- 磁場は発散しない.
- $bold(B)$ は磁束密度である.

$
  integral_S bold(B) dot bold(n) d S &= 0\
  integral_V nabla dot bold(B) d V &= 0\
  nabla dot bold(B) &= 0\
  "div" bold(B) &= 0\
$

== ファラデー・マクスウェルの法則

- 電場の回転は, 磁束を妨げる方向に磁束密度の時間変化分となる.
- $bold(E)$ は 電場, $bold(B)$ は磁束密度である.

$
  integral.cont_C bold(E) dot d bold(r) &= - integral_S (partial bold(B)) / (partial t) dot bold(n) d S\
  integral_S (nabla times bold(E)) dot bold(n) d S &= - integral_S (partial bold(B)) / (partial t) dot bold(n) d S\
  integral_S (nabla times bold(E) + (partial bold(B)) / (partial t)) dot bold(n) d S &= 0\
  nabla times bold(E) + (partial bold(B)) / (partial t) &= 0\
  nabla times bold(E) &= - (partial bold(B)) / (partial t)\
  "rot" bold(E) &= - (partial bold(B)) / (partial t)
$

== アンペール・マクスウェルの法則

- 磁場の回転は, $"電流密度" + "電束密度"bold(D)"の時間変化分"$ となる.
- $bold(H)$ は 磁場, $bold(J)$ は電流密度, $bold(D)$ は電束密度である.

$
  integral.cont_C bold(H) dot d bold(r) &= underbracket(integral_S bold(J) dot bold(n) d S, I) + integral_S (partial bold(D)) / (partial t) dot bold(n) d S\
  integral_S (nabla times bold(H)) dot bold(n) d S &= integral_S bold(J) dot bold(n) d S + integral_S (partial bold(D)) / (partial t) dot bold(n) d S\
  integral_S (nabla times bold(H) - bold(J) - (partial bold(D)) / (partial t)) dot bold(n) d S &= 0\
  nabla times bold(H) - bold(J) - (partial bold(D)) / (partial t) &= 0\
  nabla times bold(H) &= bold(J) + (partial bold(D)) / (partial t)\
  "rot" bold(H) &= bold(J) + (partial bold(D)) / (partial t)
$

== $bold(D)$, $bold(H)$, $E$, $bold(M)$, $bold(B)$

$ bold(D) = epsilon_0 bold(E) + underbracket(bold(P), "分極ベクトル") $
$ bold(H) = 1 / mu_0 bold(B) - underbracket(bold(M), "磁化ベクトル") $
$ bold(M) = underbracket(chi_m, "磁化率") bold(H) $
$ bold(B) = mu_0 underbracket(mu_r, 1 + chi_m "(比透磁率)") bold(H) $
$ E = V / d $
$ bold(B) = nabla times bold(A) $
$ "grad" A = nabla A = ((partial A) / (partial x), (partial A) / (partial y), (partial A) / (partial z)) = bold(B) $
$ "div" bold(A) = nabla dot bold(A) = (partial A_x) / (partial x) + (partial A_y) / (partial y) + (partial A_z) / (partial z) = C $

= ローレンツ力

$ bold(F) = q bold(E) + q bold(v) times bold(B) $

= 電荷保存則 (連続の式)

$ 
  - d / (d t) integral_V rho d V &= integral_S bold(J) dot bold(n) d S\
  (partial rho) / (partial t) + nabla dot bold(J) &= 0 
$

= ガウスの発散定理とストークスの定理

$ integral_S bold(D) dot bold(n) d S = integral_V nabla dot bold(D) d V $
$ integral.cont_C bold(E) dot d bold(r) = integral_S (nabla times bold(E)) dot bold(n) d S $

= 電気素量

$ e = 1.60217663 × 10^(-19) upright(C) $

= 電磁場のエネルギー保存則

- エネルギー密度の時間変化と, 電磁場のエネルギー ($bold(S)$)の発散 の和が $0$, つまり一定に保たれる.

$ 
  nabla times bold(H) - (partial bold(D)) / (partial t) &= bold(J)\
  bold(E) dot (nabla times bold(H) - (partial bold(D)) / (partial t)) &= bold(E) dot bold(J)
$
$
  nabla times bold(E) + (partial bold(B)) / (partial t) &= 0\
  bold(H) dot (nabla times bold(E) + (partial bold(B)) / (partial t)) &= 0
$
$
  bold(H) dot (nabla times bold(E) + (partial bold(B)) / (partial t)) - bold(E) dot (nabla times bold(H) - (partial bold(D)) / (partial t)) &= - bold(E) dot bold(J)\
  bold(H) dot (nabla times bold(E)) - bold(E) dot (nabla times bold(H)) + bold(H) dot (partial bold(B)) / (partial t) + bold(E) dot (partial bold(D)) / (partial t) &= - bold(E) dot bold(J)
$
$
  nabla dot (bold(E) times bold(H)) = bold(H) dot (nabla times bold(E)) - bold(E) dot (nabla times bold(H))
$
$ 
  (partial bold(E)^2) / (partial t) &= (partial bold(E) dot bold(E)) / (partial t) = (partial bold(E)) / (partial t) dot bold(E) + bold(E) dot (partial bold(E)) / (partial t) = 2 bold(E) dot (partial bold(E)) / (partial t)\
  1 / 2 (partial bold(E)^2) / (partial t) &= bold(E) dot (partial bold(E)) / (partial t)
$
$ 
  bold(H) dot (partial bold(B)) / (partial t) + bold(E) dot (partial bold(D)) / (partial t) &= epsilon_0 bold(E) dot (partial bold(E)) / (partial t) + mu_0 bold(H) dot (partial bold(H)) / (partial t) = epsilon_0 / 2 (partial bold(E)^2) / (partial t) + mu_0 / 2 (partial bold(H)^2) / (partial t)\
  &= partial / (partial t) (1 / 2 epsilon_0 bold(E)^2 + 1 / 2 mu_0 bold(H)^2) = partial / (partial t) (1 / 2 bold(E) dot bold(D) + 1 / 2 bold(B) dot bold(H)) 
$
$
  nabla dot (bold(E) times bold(H)) + partial / (partial t) (1 / 2 bold(E) dot bold(D) + 1 / 2 bold(B) dot bold(H)) &= - bold(E) dot bold(J)\
  underbracket((partial u) / (partial t), partial / (partial t) (1 / 2 bold(E) dot bold(D) + 1 / 2 bold(B) dot bold(H))) + nabla dot underbracket(bold(S), bold(E) times bold(H)) = underbracket(0, - bold(E) dot bold(J))
$

= 境界

$ 
  bold(n) times (bold(H)_1 - bold(H)_2) &= 0\
  bold(n) dot (bold(B)_1 - bold(B)_2) &= 0
$

= サイクロトロン

$ 
  (m v^2) / R &= q v B\
  omega = v / R &= (q B) / m
$