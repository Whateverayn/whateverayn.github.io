#import "template.typ": *

#show: project.with(
  title: "R-C直列回路の過渡現象", 
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

#show figure.where(
  kind: table
): set figure.caption(position: top)

#h(1em)
$t=0$ において, コンデンサの電荷 $Q$ は $0$ とする.
キルヒホッフの電圧則から, 次の式が成り立つ.
#footnote([$Q = C V <==> V = Q/C$, また, $i=(d Q)/(d t)$.])
$ V = R i+1/C integral_0^t i d t $<base>
時間 $t$ で微分する.
$k_0$ を積分定数とし, $k = e^(k_0)$ とする.
$
  (d V)/(d t)&=(d (R i))/(d t)+(d(1/C integral_0^t i d t))/(d t)\
  0&=R (d)/(d t)i+1/C d(integral_0^t i d t)/(d t)\
  &=R (d i)/(d t)+1/C i\
  R (d i)/(d t)&=-i/C\
  1/i (d i)/(d t)&=-1/(R C)\
  integral 1/i d i&=integral-1/(R C) d t\
  ln i&=-1/(R C) integral d t + k_0\
  &=-t/(R C)+k_0\
  i &= e^(-t/(R C)+k_0)\
  &=e^(k_0)e^(-t/(R C))\
  &=k e^(-t/(R C))
$<dt>
次に, $k$ の値を求める.
@dt から,
$
  i(0)&=k e^(-0/(R C))\
  &=k e^0\
  &= k
$<eq-1>
となる.
初期条件として, $t = 0$, $Q = 0$ であるから,
@base は,
$
  V&=R i + 0/C\
  &= R i\
  i&=V/R
$<eq-2>
である. @eq-1 と @eq-2 から,
$ k = V/R $
以上より, $i(t)$ は,
$ i(t) = underbracket(V/R, k) e^(-t/(R C)) [upright(A)] $
である.
時定数を $tau = R C [upright(s)]$ とすると,
$ i(t) = V/R e^(-t/tau) [A] $
となる.



// #bibliography("works.bib")