# Rubik's Cube  

☘️ This is a web implementation for n order Rubik's Cube.  

## Cube Math Theory  

We put the cube (n>=3) center to (0, 0, 0) and assum the cube side length as $ \lceil n/2 \rceil $. So that we can get the coordinate of each surface part and they are all integers.  

```math
\left\{
\begin{equation}
\begin{align}

&(h', k', l')^T = T^{-1}(h, k, l)^T \\
&(i', j', k')^T = T(i, j, k)^T \\
&T_x = \begin{pmatrix}
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

&T \in \{T_x, T_y, T_z\}, \quad T^4 = I, \quad T^3 = T^{-1} \\

\end{align}
\end{equation}
\right. \\

```  

In this equation, (h, k, l) is the position of each unit surface cube; (i, j, k) is the direction; T is the rotate transfor.  As the unit surafce part postion rotate equal to opposite axies rotate, so that (h, k, l) and (i, j, k) use reverse matrix for transfor.  

The the direction vector (i, j, k) correspond to the color {R|red=F|front, Y|yello=R|right, B|blue=U|up, G|green=D|Down, W|white=L|left, O|orange=B|back, N|None}.  After rotate (i, j, k) should be right-hard by exchange sequence or mirror transfer.  

the corner part of n=3 cube:  

| color | position | direction |
| ----  | -------- | --------- |
|  RYB  |( 1, 1, 1)|( i, j, k) |
|  RYG  |( 1, 1,-1)|( i, j,-k) |
|  OYB  |(-1, 1, 1)|(-i, j, k) |
|  OYG  |(-1, 1,-1)|(-i, j,-k) |
|  OWB  |(-1,-1, 1)|(-i,-j, k) |
|  OBG  |(-1,-1,-1)|(-i,-j,-k) |
|  RWB  |( 1,-1, 1)|( i,-j, k) |
|  RWG  |( 1,-1,-1)|( i,-j,-k) |

the center part of n=3 cube:
| color | position | direction |
| ----  | -------- | --------- |
|  NRN  |( 1, 0, 0)|( i, j, k) |
|  NYN  |( 0, 1, 0)|( i, j, k) |
|  NBN  |( 0, 0, 1)|( i, j, k) |
|  NGN  |( 0, 0,-1)|( i, j,-k) |
|  NWN  |( 0,-1, 0)|( i,-j, k) |
|  NON  |(-1, 0, 0)|(-i, j, k) |

## Operation Notation

1. RLUDFB Notation (Singmaster symbol)  
   > \<R|L|U|D|F|B>\[reverse][times]

   For example, RUR'URU2R'  

2. XYZ Notation
    > \<X|Y|Z>(I, [times])

    For example, X(2)X(-2)Y(2, 2)Y(2, -1)

## Reference  

1. [cube equation](https://www.bilibili.com/video/BV1N44y1H7aJ)
2. [rubik cube proof](http://www.geometer.org/rubik/group.pdf)
3. [cube group operation](https://www.toutiao.com/answer/6753547890284560647)  
