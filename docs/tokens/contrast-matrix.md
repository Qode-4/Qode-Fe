# Contrast matrix

> `yarn tokens:check` 가 생성한다. 직접 수정하지 않는다.

- 굵게 = 의도한 조합(`scripts/tokens-check.ts` 의 REQUIRED). ✅ 기준 충족 / ❌ 미달.
- 기준: 텍스트 4.5:1, 비텍스트 UI(`line-*`, `danger` 경계) 3:1 (WCAG 2.1 AA).
- 작은 숫자 = 의도하지 않은 조합 중 4.5:1 미만. 이 조합을 쓰려면 먼저 REQUIRED 에 추가해 검증한다.

| 전경 \ 배경 | `canvas` | `surface` | `surface-muted` | `sidebar` | `primary` | `primary-strong` | `primary-soft` | `danger` | `danger-soft` | `success-soft` | `code` | `code-raised` | `inverse` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fg-default` `#0e0e0f` | **17.93** ✅ | **19.29** ✅ | **17.93** ✅ | **18.50** ✅ | 6.68 | 5.30 | **17.32** ✅ | <sub>3.43</sub> | **17.79** ✅ | **18.32** ✅ | <sub>1.09</sub> | <sub>1.30</sub> | <sub>1.30</sub> |
| `fg-subtle` `#52545a` | **7.03** ✅ | **7.57** ✅ | **7.03** ✅ | **7.26** ✅ | <sub>2.62</sub> | <sub>2.08</sub> | **6.79** ✅ | <sub>1.35</sub> | 6.98 | 7.19 | <sub>2.34</sub> | <sub>1.97</sub> | <sub>1.97</sub> |
| `fg-muted` `#61646b` | **5.51** ✅ | **5.93** ✅ | **5.51** ✅ | **5.68** ✅ | <sub>2.05</sub> | <sub>1.63</sub> | **5.32** ✅ | <sub>1.05</sub> | 5.47 | 5.63 | <sub>2.99</sub> | <sub>2.51</sub> | <sub>2.51</sub> |
| `fg-primary` `#b54700` | **5.05** ✅ | **5.43** ✅ | **5.05** ✅ | 5.21 | <sub>1.88</sub> | <sub>1.49</sub> | **4.88** ✅ | <sub>1.04</sub> | 5.01 | 5.16 | <sub>3.26</sub> | <sub>2.74</sub> | <sub>2.74</sub> |
| `fg-on-primary` `#0e0e0f` | 17.93 | 19.29 | 17.93 | 18.50 | **6.68** ✅ | 5.30 | 17.32 | <sub>3.43</sub> | 17.79 | 18.32 | <sub>1.09</sub> | <sub>1.30</sub> | <sub>1.30</sub> |
| `fg-danger` `#c62828` | **5.23** ✅ | **5.62** ✅ | 5.23 | 5.39 | <sub>1.95</sub> | <sub>1.54</sub> | 5.05 | <sub>1.00</sub> | **5.18** ✅ | 5.34 | <sub>3.15</sub> | <sub>2.65</sub> | <sub>2.65</sub> |
| `fg-success` `#007a55` | **4.99** ✅ | **5.36** ✅ | 4.99 | 5.14 | <sub>1.86</sub> | <sub>1.47</sub> | 4.81 | <sub>1.05</sub> | 4.95 | **5.09** ✅ | <sub>3.30</sub> | <sub>2.78</sub> | <sub>2.78</sub> |
| `fg-code` `#efefef` | <sub>1.07</sub> | <sub>1.15</sub> | <sub>1.07</sub> | <sub>1.10</sub> | <sub>2.51</sub> | <sub>3.16</sub> | <sub>1.03</sub> | 4.89 | <sub>1.06</sub> | <sub>1.09</sub> | **15.41** ✅ | **12.95** ✅ | 12.95 |
| `fg-code-muted` `#9f9fa9` | <sub>2.44</sub> | <sub>2.62</sub> | <sub>2.44</sub> | <sub>2.51</sub> | <sub>1.10</sub> | <sub>1.39</sub> | <sub>2.35</sub> | <sub>2.14</sub> | <sub>2.42</sub> | <sub>2.49</sub> | **6.75** ✅ | **5.68** ✅ | 5.68 |
| `fg-on-dark` `#ffffff` | <sub>1.08</sub> | <sub>1.00</sub> | <sub>1.08</sub> | <sub>1.04</sub> | <sub>2.89</sub> | <sub>3.64</sub> | <sub>1.11</sub> | **5.62** ✅ | <sub>1.08</sub> | <sub>1.05</sub> | 17.72 | 14.89 | **14.89** ✅ |
| `line-strong` `#61646b` | **5.51** ✅ | **5.93** ✅ | 5.51 | 5.68 | <sub>2.05</sub> | <sub>1.63</sub> | 5.32 | <sub>1.05</sub> | 5.47 | 5.63 | <sub>2.99</sub> | <sub>2.51</sub> | <sub>2.51</sub> |
| `line-primary` `#e05e00` | **3.38** ✅ | **3.64** ✅ | <sub>3.38</sub> | <sub>3.49</sub> | <sub>1.26</sub> | <sub>1.00</sub> | <sub>3.27</sub> | <sub>1.54</sub> | <sub>3.36</sub> | <sub>3.45</sub> | 4.87 | <sub>4.09</sub> | <sub>4.09</sub> |
| `danger` `#c62828` | **5.23** ✅ | **5.62** ✅ | 5.23 | 5.39 | <sub>1.95</sub> | <sub>1.54</sub> | 5.05 | <sub>1.00</sub> | 5.18 | 5.34 | <sub>3.15</sub> | <sub>2.65</sub> | <sub>2.65</sub> |
