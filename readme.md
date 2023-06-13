# C3Cube

☘️ This is a web implementation for n order Rubik's Cube. The math model of this project is documented below.  

![c3cube](screenshot/c3cube.png)

## Rubik's Cube Math Theory  

### (1) Cube Introduce  

We define the unit is **the piece on the cube surface**. There are 3 types of unit: **corner**, **edge**, **inner** unit.  We can see 3 colors on corner unit, 2 colors on edge unit and 1 color on inner unit. In n-order Rubik's Cube (**n-cube**), there are $n^3-(n-2)^3$ unit on cube. Among them are 8 corner unit, $4n(n-2)$ edge unit, $2n(n-2)$ inner unit.  

There are 6 faces in cube, as **front, back, left, right, up, Down**, which make the **face collection** $\{f, b, l, r, u, d\}$. We use 6 different colors painted on each face, as **Red, Orange, White, Yellow, Blue, Green, None**, which make the **color collection** $\{R,O,W,Y,B,G,N\}$. $N$ is the dummy part to describe no color.  We assum that the cube observe this color mapping:  

```math
\begin {align}
&face \in \{f, b, l, r, u, d\}\\
&color \in \{R, O, W, Y, B, G, N\} \\
&face \rightarrow color \in 
\{f \rightarrow R, b \rightarrow O, l \rightarrow W, r \rightarrow Y, u \rightarrow B, d \rightarrow G\}
\end {align}
```

### (2) Unit Piece Coordinate  

We put the **n-cube** (n>=3) center to $(0, 0, 0)$ and assum that the cube side length as $\lceil n/2 \rceil$. So that we can get the coordinate of each surface unit and they are all integers. The range of cooridinate is $[(n+1) \mod 2, \lfloor n/2 \rfloor]$. We use $(h, k, l)$ to represent the unit piece position.  

```math
\begin {align}
&[a, b] = [(n+1) \mod 2, \lfloor n/2 \rfloor]\\
& unit \in \{(h, k, l)|a \leq |h|, |k|, |l| \leq b, \exists c \in  \{h, k, j\}, |c|=b\} \\
& corner \leftrightarrow |h|=|k|=|l|= b \\
& edge \leftrightarrow \exists \{c_1, c_2\} \in \{h, k, l\}, |c_1|=a, |c_2|=b \\
& inner \leftrightarrow \exists \{c_1, c_2\} \in \{h, k, l\}, |c_1|=|c_2|=a \\
\end {align}
```

### (3) Unit Piece Rotate  

We use $(h, k, l)$ to indicate postion, $(i, j, k)$ to indicate oritation, and $(c_1, c_2, c_3)$ to indicate color, which is correspond to oritation. One step rotate on unit piece is 90°. We define the anti-clock for positive direction and the unit piece operation $Fu(h, k, l)$ is as below.  

```math
\begin{align}
&(h', k', l')^T = T^{-1}(h, k, l)^T\\
&(i', j', k')^T = T(i, j, k)^T\\
&(i, j, k) \rightarrow (c_1, c_2, c_3), (i', j', k') \rightarrow (c_1', c_2', c_3') \\
&T \in \{T_x, T_y, T_z\}, \quad T^4 = I, \quad T^3 = T^{-1}
\end{align}
```

```math
\begin{align}
T_x = \begin{pmatrix}
1 & 0 & 0\\
0 & 0 & 1\\
0 & -1 & 0\\
\end{pmatrix}, 

T_y = \begin{pmatrix}
0 & 0 & -1\\
0 & 1 & 0\\
1 & 0 & 0\\
\end{pmatrix}, 

T_z = \begin{pmatrix}
0 & 1 & 0\\
-1 & 0 & 0\\
0 & 0 & 1\\
\end{pmatrix} \\
\end{align}
```

In this equation,  $T$ is the rotate transfor operation.  As the unit surafce postion rotate equal to opposite axies rotate, so that the matrix on $(h, k, l)$ and $(i, j, k)$ are reverse.  

If $(i, j, k)$ is not observe to right-hand corrdinate, before rotate, it should be applied mirror operation to right-hand; And after rotate,  the sequence of $(i', j', k')$ shoud be permute to right-hand sequence. We use the equations below to adjust oritation rotate to right-hand coordinate. The permute is that sort the sequence of both oritation and color simultaneous to make oritation sequence to i, j, k.  

```math
\begin{align}
&M=I*sign((i, j, k)^T) \\
&(i', j', k')^T = MT(i, j, k)^TM \\
&permute((i', j', k')) = (i, j, k) \rightarrow \\
&permute(c_1,c_2, c_3)=(c_1', c_2', c_3')
\end{align}
```

### (4) Cube Operation  

The operation on cube is that rotate a plane 90° by an axis. The unit piece on this plane are rotating together. We use $G(t)$ to select the coordinate in axis $t$, and $F(t, i)$ to represents one operation on axis a and the plain coordinate on axis $t$ is $i$.  

```math
\begin{align}
&G(t) = \{c|c \in \{h, k, l\}, \text{c is on axis t} \}\ \\
&F(t, i) = \prod Fu(h, k, l) \\
&G(t) \equiv i
\end{align}
```

Here are some operation denote methods:  
**a. RLUDFB Notation (Singmaster symbol)**
   > \<R|L|U|D|F|B>\[reverse][times]

   For example, RUR'URU2R'  
**b. XYZ Notation**
  > \<X|Y|Z>(I, [times])
  
  For example, X(2)X(-2)Y(2, 2)Y(2, -1)

## C3Cube status

These examples are about innercorner surface unit 3-cube
The corner unit:  
| color | position |orientation|
| ----  | -------- | --------- |
|  RYB  |( 1, 1, 1)|( i, j, k) |
|  RYG  |( 1, 1,-1)|( i, j,-k) |
|  OYB  |(-1, 1, 1)|(-i, j, k) |
|  OYG  |(-1, 1,-1)|(-i, j,-k) |
|  OWB  |(-1,-1, 1)|(-i,-j, k) |
|  OBG  |(-1,-1,-1)|(-i,-j,-k) |
|  RWB  |( 1,-1, 1)|( i,-j, k) |
|  RWG  |( 1,-1,-1)|( i,-j,-k) |

The edge unit:
| color | position |orientation|
| ----  | -------- | --------- |
|  RNB  |( 1, 0, 1)|( i, j, k) |
|  NYB  |( 0, 1, 1)|( i, j, k) |
|  ONB  |(-1, 0, 1)|(-i, j, k) |
|  NWB  |( 0,-1, 1)|( i,-j,k) |
|  RYN  |( 1, 1, 0)|( i, j, k) |
|  OYN  |(-1, 1, 0)|(-i, j, k) |
|  OWN  |(-1,-1, 0)|(-i,-j, k) |
|  RWN  |( 1,-1, 0)|( i,-j, k) |
|  RNG  |( 1, 0,-1)|( i, j,-k) |
|  NYG  |( 0, 1,-1)|( i, j,-k) |
|  ONG  |(-1, 0,-1)|(-i, j,-k) |
|  NWG  |( 0,-1,-1)|( i,-j,-k) |

The inner unit:
| color | position |orientation|
| ----  | -------- | --------- |
|  NRN  |( 1, 0, 0)|( i, j, k) |
|  NYN  |( 0, 1, 0)|( i, j, k) |
|  NBN  |( 0, 0, 1)|( i, j, k) |
|  NGN  |( 0, 0,-1)|( i, j,-k) |
|  NWN  |( 0,-1, 0)|( i,-j, k) |
|  NON  |(-1, 0, 0)|(-i, j, k) |

## Reference  

1. [cube equation](https://www.bilibili.com/video/BV1N44y1H7aJ)
2. [rubik cube proof](http://www.geometer.org/rubik/group.pdf)
3. [cube group operation](https://www.toutiao.com/answer/6753547890284560647)  
