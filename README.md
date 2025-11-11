# Números Mixe-Zoqueanos

Ese un tipo que tiene los glifos para representar los numeros en los lenguages Mixe-Zoqueanos. Ese tipo tiene los numeros 0 hasta 9 y ligaduras para los numeros hasta 40 (y 100). Tiene un símbolo neuvo para representar que uno numero esta arriba de otro: `+`. Tiene un glifo expirimental para significar la porcion que esta proxima es un decimal: `.`.

Tradicionalmente, los numeros Mixe-Zoqueanos tiene una sistema de escribir numeros mas grande de 19 verticalmente. Cada poder de 20 tiene otro espacio. Entonces, si quiero escribir el numero de 400, tengo que escribir un 1 arriba de dos espacios (lugares vacios). Ese sistema no es compatible con el systema de typografía utilizada por los sistemas informaticas. Entonces, hice un numero para representar cero en lugar de los espacios. Tambien, hice un símbolo representada por `+` y significa `ko`, o `abajo de ese`.

Hecho con [Birdfont](https://birdfont.org/).

## Systema de numeracíon

Los posiciones y valores de los números:

| Nivel | Nombre de Nivel | Valor de Nivel |
|-------|-----------------|----------------|
| 4     | `Carga`         |           8000 |
| 3     | `Camote`        |            400 |
| 2     | `Veinte`        |             20 |
| 1     | `Uno`           |              1 |

Por ejemplo, en Nuntajɨɨyi’, es una posibilidad para contar a numeros grandes:

| Numero | Nivel | Valor |
|-|-|-|
| \*mak-mos-maktas | tsɨɨmi | 19 * 8000 |
| \*mak-tujtu | mɨn | 16 * 400 |
| mak | ips | 10 * 20 |
| \*mak-wɨs | tuum | 12 * 1 |
| | **Total** | 19 * 8000 + 16 * 400 + 10 * 20 + 12 = 158612 |

`*makmosmaktastsɨɨmi maktujmɨn makips makwɨsteen`

`*yɨtmaktatsɨɨmi maktujmɨn makips makwɨsteen`

`One hundred fifty-eight thousand six hundred twelve`

`Ciento cincuenta y ocho mil seis ciento doce`

Usando ese tipo, es posible para escribir ese numero como: 19+16+10+12.

| Numero | Nivel | Valor |
|-|-|-|
| \*mak-mos-maktas | tsɨɨmi | 19 * 8000 |
| \*mak-mos-maktas | mɨn | 19 * 400 |
| \*mak-mos-maktas | ips | 19 * 20 |
| \*mak-mos-maktas | tuum | 19 * 1 |

| **Total** |
|-|
| 19 * 8000 + 19 * 400 + 19 * 20 + 19 = 159999 |

`*makmosmaktatsɨɨmi makmosmaktasmɨn makmosmaktasips makmosmaktasteen`

`*yɨtmaktatsɨɨmi yɨtmaktasmɨn yɨtmaktasips yɨtmaktasteen`

`One hundred fifty-nine thousand nine hundred ninety-nine`

`Ciento cincuenta y nueve mil nueve ciento noventa y nueve`

Usando ese tipo, es posible para escribir ese numero como: 19+19+19+19.

Y hay una posibilidad para expresar numeros de nivel N con glifos, excepto que no puede dicir estos numeros.

| Nivel | Nombre de Nivel | Valor de Nivel |
|-------|-----------------|------------------|
| N     | ?               | 20<sup>N-1</sup> |
| 8     | ?               |        128000000 |
| 7     | ?               |         64000000 |
| 6     | ?               |          3200000 |
| 5     | ?               |           160000 |
| 4     | `Carga`         |             8000 |
| 3     | `Camote`        |              400 |
| 2     | `Veinte`        |               20 |
| 1     | `Uno`           |                1 |

Hay 16,000,000,000 transistores en un procesor M1 de Apple:

| Nivel| Numero | Valor<sup>Nivel-1</sup> |
|-|-|-|
| 8 | 12 | 12 * 20<sup>7</sup> |
| 7 | 10 | 10 * 20 <sup>6</sup> |
| 6 |  0 | 0 * 20<sup>5</sup> |
| 5 |  0 | 0 * 20<sup>4</sup> |
| 4 |  0 | 0 * 20<sup>3</sup> |
| 3 |  0 | 0 * 20<sup>2</sup> |
| 2 |  0 | 0 * 20<sup>1</sup> |
| 1 |  0 | 0 * 20<sup>0</sup> |

O con ese tipo: 12+10+0+0+0+0+0+0