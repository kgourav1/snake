import nltk
from nltk.corpus import wordnet as wn

nltk.download('wordnet')

words = sorted(
    w.lower()
    for w in set(wn.all_lemma_names())
    if len(w) > 3 and "_" not in w
)

print(len(words))
