---
layout: post
title: from NeRF to Zip-NeRF 
date: 2015-10-20 11:12:00-0400
description: an example of a blog post with some math
tags: nerf code generative ai 
categories: blog 
related_posts: false
---

# From NeRF to ZipNeRF

There has been a lot of work in the past few years on using Neural Radiance Fields (NeRF) for *novel view synthesis*, which is essentially using a set of 2D camera views of some scene and learning a model that extrapolates these images to produce unseen views of the scene. Despite this fact, 

## Neural Radiance Fields Overview

$$
\sum_{k=1}^\infty |\langle x, e_k \rangle|^2 \leq \|x\|^2
$$

You can also use `\begin{equation}...\end{equation}` instead of `$$` for display mode math.
MathJax will automatically number equations:

\begin{equation}
\label{eq:cauchy-schwarz}
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
\end{equation}

and by adding `\label{...}` inside the equation environment, we can now refer to the equation using `\eqref`.

Note that MathJax 3 is [a major re-write of MathJax](https://docs.mathjax.org/en/latest/upgrading/whats-new-3.0.html) that brought a significant improvement to the loading and rendering speed, which is now [on par with KaTeX](http://www.intmath.com/cg5/katex-mathjax-comparison.php).
