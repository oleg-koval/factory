---- MODULE Admission ----
EXTENDS Naturals, FiniteSets

CONSTANTS Issues, Workers, Cap
VARIABLES claims, running, review, eligible

vars == <<claims, running, review, eligible>>
Reserved == {i \in Issues : \E w \in Workers : <<i, w>> \in claims}
Owner(i) == CHOOSE w \in Workers : <<i, w>> \in claims
Occupancy == Reserved \cup review

Init ==
    /\ claims = {}
    /\ running = {}
    /\ review = {}
    /\ eligible = Issues

Admit(i, w) ==
    /\ i \in eligible \ Occupancy
    /\ w \notin {Owner(j) : j \in Reserved}
    /\ Cardinality(Occupancy) < Cap
    /\ claims' = claims \cup {<<i, w>>}
    /\ running' = running \cup {w}
    /\ UNCHANGED <<review, eligible>>

Handoff(i) ==
    /\ i \in Reserved
    /\ Owner(i) \in running
    /\ review' = review \cup {i}
    /\ running' = running \ {Owner(i)}
    /\ UNCHANGED <<claims, eligible>>

Consume(i) ==
    /\ i \in Reserved \cap review \cap eligible
    /\ eligible' = eligible \ {i}
    /\ UNCHANGED <<claims, running, review>>

Interrupt(i) ==
    /\ i \in Reserved
    /\ Owner(i) \in running
    /\ running' = running \ {Owner(i)}
    /\ UNCHANGED <<claims, review, eligible>>

Clear(i) ==
    /\ i \in Reserved
    /\ Owner(i) \notin running
    /\ claims' = claims \ {<<i, Owner(i)>>}
    /\ UNCHANGED <<running, review, eligible>>

Release(i) == i \in review \ eligible /\ Clear(i)
Abandon(i) == Clear(i)

Decide(i) ==
    /\ i \in review
    /\ review' = review \ {i}
    /\ UNCHANGED <<claims, running, eligible>>

Next ==
    \/ \E i \in Issues, w \in Workers : Admit(i, w)
    \/ \E i \in Issues : Handoff(i) \/ Consume(i) \/ Interrupt(i) \/ Release(i) \/ Abandon(i) \/ Decide(i)

Spec == Init /\ [][Next]_vars
TypeOK ==
    /\ claims \subseteq Issues \X Workers
    /\ running \subseteq Workers
    /\ review \subseteq Issues
    /\ eligible \subseteq Issues
OneOwner == \A i \in Issues : Cardinality({w \in Workers : <<i, w>> \in claims}) <= 1
RunningOwned == \A w \in running : Cardinality({i \in Reserved : <<i, w>> \in claims}) = 1
Capacity == Cardinality(Occupancy) <= Cap
====
