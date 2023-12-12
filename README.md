# mt-lang

~~Mihail Tratsiuk's~~ My Tiny Lang

## Syntax

```lisp
;; Function call

(+ 1 2)

(+
  1
  2)

(- 2 1)


;; Variable declaration

(def pi 3.14)


;; Function declaration

(def mult
  (|a b|
    (* a b)))

;; Array declaration

(def array [1 2 3])


;; Field access

(def pi Math/PI)

(def first [1 2 3]/0)

([1 2 3]/map
  (|x| (* x 2)))


;; Method call chaining

(def sum
  (~> ["1" "2" "3"]
   ~> map Number
   ~> reduce (|c r| (+ r c)) 0))


;; Conditional evaluation

(cond
  ((> 4 5)
    (print "1"))
  ((and true false)
    (print "2"))
  (else
    (print "3")))
```
