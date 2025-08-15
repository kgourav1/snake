from nltk.corpus import words

# Get the word list from nltk
word_list = words.words()

# Filter for 5-letter meaningful words
five_letter_words = sorted(set([w.upper() for w in word_list if len(w) == 5]))

# Save all words to txt file
with open("7.txt", "w") as f:
    f.write(",".join(five_letter_words))

print(len(five_letter_words), five_letter_words[:20])
