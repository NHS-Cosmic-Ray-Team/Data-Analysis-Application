# Writing an Inclusion Query

✔️ Actively supported

## Description

Inclusion queries are made to refine data based on mathematical expressions and column values. If a query equates to true, the data point will be included. Otherwise, the data point will be left out.

## Syntax

### Variables

Queries can make reference to the values of a column with the following syntax:

``` ${COLUMN_NAME} ```

### Example Queries

1. Only CO2 values that are less than 500

``` ${CO2} < 500 ```

2. Only include data points between 2:00 AM and 8:00 AM

``` 20000 <= ${TIME} and ${TIME} <= 80000 ```

3. Only include data points with an even number of muons

``` trunc(${COUNT}) % 2 == 0 ```

## Matching Mode

The query matching simply defines when a data point should be included. If AND Matching Mode is enabled, then a data point must meet all queries to be included in the final result. But if it's not enabled, the system turns to OR Matching Mode, which requires that only one query is met by a data point to be included.

### Reference

#### Operators

| Operator | Description              | Syntax  | Example                  |
|----------|--------------------------|---------|--------------------------|
| ==       | Equals                   | a == b  | 2 + 1 == 3 (true)        |
| !=       | Not Equals               | a != b  | 2 + 1 != 4 (true)        |
| <        | Less than                | a < b   | 2 < 5 (true)             |
| >        | Greater than             | a > b   | 7 > 3 (true)             |
| <=       | Less than or equal to    | a <= b  | 5 <= 5 (true)            |
| >=       | Greater than or equal to | a >= b  | 5 >= 5 (true)            |
| +        | Add                      | a + b   | 2 + 1 = 3                |
| -        | Subtract                 | a - b   | 2 - 1 = 1                |
| *        | Multiply                 | a * b   | 2 * 3 = 6                |
| /        | Divide                   | a / b   | 9 / 3 = 3                |
| ^        | Power                    | a ^ b   | 2 ^ 3 = 8                |
| %        | Modulus                  | a % b   | 8 % 3 = 2                |
| !        | Factorial                | a!      | 3! = 6                   |
| and      | Logical And              | a and b | 3 == 2 and 2 < 3 (false) |
| or       | Logical Or               | a or b  | 3 == 2 or 2 < 3 (true)   |
| not      | Logical Not              | not a   | not 3 == 4 (true)        |
| xor      | Logical Xor              | a xor b | 3 == 3 xor 2 < 3 (false) |

#### Functions

| Function | Description                   | Syntax               | Example            | Example Result |
|----------|-------------------------------|----------------------|--------------------|----------------|
| abs      | Absolute value                | abs(x)               | abs(-7)            | 7              |
| acos     | Arccosine                     | acos(x)              | acos(0)            | pi/2           |
| acosh    | Hyperbolic arccosine          | acosh(x)             | acosh(1)           | 0              |
| asin     | Arcsine                       | asin(x)              | asin(1)            | pi/2           |
| asinh    | Hyperbolic arcsine            | asinh(x)             | asinh(0)           | 0              |
| atan     | Arctangent                    | atan(x)              | atan(0)            | 0              |
| atanh    | Hyperbolic arctangent         | atanh(x)             | atanh(0)           | 0              |
| atan2    | Arctangent                    | atan(y, x)           | atan(5, 5)         | pi/4           |
| cbrt     | Cube root                     | cbrt(x)              | cbrt(27)           | 3              |
| ceil     | Round up                      | ceil(x)              | ceil(0.2)          | 1              |
| cos      | Cosine                        | cos(x)               | cos(pi/2)          | 0              |
| cosh     | Hyperbolic cosine             | cosh(x)              | cosh(0)            | 1              |
| exp      | E^x                           | exp(x)               | exp(1)             | E              |
| floor    | Round down                    | floor(x)             | floor(0.7)         | 0              |
| hypot    | Square root of sum of squares | hypot(x[, y[, ...]]) | hypot(3, 4)        | 5              |
| log      | Natural logarithm             | log(x)               | log(E)             | 1              |
| log10    | Base-10 logarithm             | log10(x)             | log10(10)          | 1              |
| log2     | Base-2 logarithm              | log2(x)              | log2(16)           | 4              |
| max      | Maximum                       | max(x[, y[, ...]])   | max(3, -2)         | 3              |
| min      | Minimum                       | min(x[, y[, ...]])   | min(3, -2)         | -2             |
| round    | Round                         | round(x)             | round(2.6)         | 3              |
| sign     | Sign                          | sign(x)              | sign(-2)           | -1             |
| sin      | Sine                          | sin(x)               | sin(pi/6)          | 0.5            |
| sinh     | Hyperbolic sine               | sinh(x)              | sinh(0)            | 0              |
| sqrt     | Square root                   | sqrt(x)              | sqrt(25)           | 5              |
| tan      | Tangent                       | tan(x)               | tan(pi/4)          | 1              |
| tanh     | Hyperbolic tangent            | tanh(x)              | tanh(0)            | 0              |
| trunc    | Truncate                      | trunc(x)             | trunc(30.7)        | 30             |

#### Constants

| Constant | Description             | Value   |
|----------|-------------------------|---------|
| E        | Euler's number          | 2.718   |
| LN2      | Natural logarithm of 2  | 0.693   |
| LN10     | Natural logarithm of 10 | 2.303   |
| LOG2E    | Base-2 logarithm of E   | 1.443   |
| LOG10E   | Base-10 logarithm of E  | 0.434   |
| PI       | Pi                      | 3.14159 |
| SQRT1_2  | Square root of 0.5      | 0.707   |
| SQRT2    | Square root of 2        | 1.414   |