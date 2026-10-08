(function (global) {
  'use strict';

  var snippets = {

    insertBegin: {
      cpp: [
        ['sig', 'void insertAtBeginning(int value) {'],
        ['create', '    Node* newNode = new Node(value);'],
        ['link', '    newNode->next = head;'],
        ['sethead', '    head = newNode;'],
        ['dll', '    if (newNode->next) newNode->next->prev = newNode;'],
        ['dll2', '    newNode->prev = nullptr;'],
        ['circle', '    if (tail) tail->next = newNode;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void insertAtBeginning(int value) {'],
        ['create', '    Node newNode = new Node(value);'],
        ['link', '    newNode.next = head;'],
        ['sethead', '    head = newNode;'],
        ['dll', '    if (newNode.next != null) newNode.next.prev = newNode;'],
        ['dll2', '    newNode.prev = null;'],
        ['circle', '    if (tail != null) tail.next = newNode;'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def insert_at_beginning(self, value):'],
        ['create', '    new_node = Node(value)'],
        ['link', '    new_node.next = self.head'],
        ['sethead', '    self.head = new_node'],
        ['dll', '    if new_node.next: new_node.next.prev = new_node'],
        ['dll2', '    new_node.prev = None'],
        ['circle', '    if self.tail: self.tail.next = new_node']
      ],
      pseudo: [
        ['sig', 'PROCEDURE InsertAtBeginning(value)'],
        ['create', '    newNode <- CREATE Node(value)'],
        ['link', '    newNode.next <- head'],
        ['sethead', '    head <- newNode'],
        ['dll', '    IF newNode.next != NULL THEN newNode.next.prev <- newNode'],
        ['dll2', '    newNode.prev <- NULL'],
        ['circle', '    IF tail != NULL THEN tail.next <- newNode'],
        ['end', 'END PROCEDURE']
      ]
    },

    insertEnd: {
      cpp: [
        ['sig', 'void insertAtEnd(int value) {'],
        ['create', '    Node* newNode = new Node(value);'],
        ['init', '    if (head == nullptr) { head = newNode; return; }'],
        ['init', '    Node* temp = head;'],
        ['loop', '    while (temp->next != nullptr)'],
        ['advance', '        temp = temp->next;'],
        ['link', '    temp->next = newNode;'],
        ['dll', '    newNode->prev = temp;'],
        ['circle', '    if (circular) newNode->next = head;'],
        ['settail', '    tail = newNode;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void insertAtEnd(int value) {'],
        ['create', '    Node newNode = new Node(value);'],
        ['init', '    if (head == null) { head = newNode; return; }'],
        ['init', '    Node temp = head;'],
        ['loop', '    while (temp.next != null)'],
        ['advance', '        temp = temp.next;'],
        ['link', '    temp.next = newNode;'],
        ['dll', '    newNode.prev = temp;'],
        ['circle', '    if (circular) newNode.next = head;'],
        ['settail', '    tail = newNode;'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def insert_at_end(self, value):'],
        ['create', '    new_node = Node(value)'],
        ['init', '    if self.head is None:'],
        ['init', '        self.head = new_node'],
        ['loop', '    temp = self.head'],
        ['loop', '    while temp.next:'],
        ['advance', '        temp = temp.next'],
        ['link', '    temp.next = new_node'],
        ['dll', '    new_node.prev = temp'],
        ['circle', '    if circular: new_node.next = self.head'],
        ['settail', '    self.tail = new_node']
      ],
      pseudo: [
        ['sig', 'PROCEDURE InsertAtEnd(value)'],
        ['create', '    newNode <- CREATE Node(value)'],
        ['init', '    IF head = NULL THEN head <- newNode, RETURN'],
        ['init', '    temp <- head'],
        ['loop', '    WHILE temp.next != NULL'],
        ['advance', '        temp <- temp.next'],
        ['link', '    temp.next <- newNode'],
        ['dll', '    newNode.prev <- temp'],
        ['circle', '    IF circular THEN newNode.next <- head'],
        ['settail', '    tail <- newNode'],
        ['end', 'END PROCEDURE']
      ]
    },

    insertPos: {
      cpp: [
        ['sig', 'void insertAtPosition(int value, int pos) {'],
        ['create', '    Node* newNode = new Node(value);'],
        ['init', '    Node* temp = head;'],
        ['loop', '    for (int i = 1; i < pos - 1; i++)'],
        ['advance', '        temp = temp->next;'],
        ['link1', '    newNode->next = temp->next;'],
        ['dll', '    newNode->prev = temp;'],
        ['dll2', '    temp->next->prev = newNode;'],
        ['link2', '    temp->next = newNode;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void insertAtPosition(int value, int pos) {'],
        ['create', '    Node newNode = new Node(value);'],
        ['init', '    Node temp = head;'],
        ['loop', '    for (int i = 1; i < pos - 1; i++)'],
        ['advance', '        temp = temp.next;'],
        ['link1', '    newNode.next = temp.next;'],
        ['dll', '    newNode.prev = temp;'],
        ['dll2', '    temp.next.prev = newNode;'],
        ['link2', '    temp.next = newNode;'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def insert_at_position(self, value, pos):'],
        ['create', '    new_node = Node(value)'],
        ['init', '    temp = self.head'],
        ['loop', '    for _ in range(1, pos - 1):'],
        ['advance', '        temp = temp.next'],
        ['link1', '    new_node.next = temp.next'],
        ['dll', '    new_node.prev = temp'],
        ['dll2', '    temp.next.prev = new_node'],
        ['link2', '    temp.next = new_node']
      ],
      pseudo: [
        ['sig', 'PROCEDURE InsertAtPosition(value, pos)'],
        ['create', '    newNode <- CREATE Node(value)'],
        ['init', '    temp <- head'],
        ['loop', '    FOR i <- 1 TO pos - 2'],
        ['advance', '        temp <- temp.next'],
        ['link1', '    newNode.next <- temp.next'],
        ['dll', '    newNode.prev <- temp'],
        ['dll2', '    temp.next.prev <- newNode'],
        ['link2', '    temp.next <- newNode'],
        ['end', 'END PROCEDURE']
      ]
    },

    deleteBegin: {
      cpp: [
        ['sig', 'void deleteAtBeginning() {'],
        ['init', '    Node* temp = head;'],
        ['sethead', '    head = head->next;'],
        ['circle', '    if (tail) tail->next = head;'],
        ['dll', '    if (head) head->prev = nullptr;'],
        ['free', '    delete temp;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void deleteAtBeginning() {'],
        ['init', '    Node temp = head;'],
        ['sethead', '    head = head.next;'],
        ['circle', '    if (tail != null) tail.next = head;'],
        ['dll', '    if (head != null) head.prev = null;'],
        ['free', '    temp = null;   // garbage collected'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def delete_at_beginning(self):'],
        ['init', '    temp = self.head'],
        ['sethead', '    self.head = self.head.next'],
        ['circle', '    if self.tail: self.tail.next = self.head'],
        ['dll', '    if self.head: self.head.prev = None'],
        ['free', '    del temp']
      ],
      pseudo: [
        ['sig', 'PROCEDURE DeleteAtBeginning'],
        ['init', '    temp <- head'],
        ['sethead', '    head <- head.next'],
        ['circle', '    IF tail != NULL THEN tail.next <- head'],
        ['dll', '    IF head != NULL THEN head.prev <- NULL'],
        ['free', '    FREE temp'],
        ['end', 'END PROCEDURE']
      ]
    },

    deleteEnd: {
      cpp: [
        ['sig', 'void deleteAtEnd() {'],
        ['init', '    Node* temp = head;'],
        ['loop', '    while (temp->next->next != nullptr)'],
        ['advance', '        temp = temp->next;'],
        ['target', '    Node* target = temp->next;'],
        ['free', '    delete target;'],
        ['link', '    temp->next = nullptr;'],
        ['settail', '    tail = temp;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void deleteAtEnd() {'],
        ['init', '    Node temp = head;'],
        ['loop', '    while (temp.next.next != null)'],
        ['advance', '        temp = temp.next;'],
        ['target', '    Node target = temp.next;'],
        ['free', '    target = null;'],
        ['link', '    temp.next = null;'],
        ['settail', '    tail = temp;'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def delete_at_end(self):'],
        ['init', '    temp = self.head'],
        ['loop', '    while temp.next.next:'],
        ['advance', '        temp = temp.next'],
        ['target', '    target = temp.next'],
        ['free', '    del target'],
        ['link', '    temp.next = None'],
        ['settail', '    self.tail = temp']
      ],
      pseudo: [
        ['sig', 'PROCEDURE DeleteAtEnd'],
        ['init', '    temp <- head'],
        ['loop', '    WHILE temp.next.next != NULL'],
        ['advance', '        temp <- temp.next'],
        ['target', '    target <- temp.next'],
        ['free', '    FREE target'],
        ['link', '    temp.next <- NULL'],
        ['settail', '    tail <- temp'],
        ['end', 'END PROCEDURE']
      ]
    },

    deletePos: {
      cpp: [
        ['sig', 'void deleteAtPosition(int pos) {'],
        ['init', '    Node* temp = head;'],
        ['loop', '    for (int i = 1; i < pos - 1; i++)'],
        ['advance', '        temp = temp->next;'],
        ['target', '    Node* target = temp->next;'],
        ['link', '    temp->next = target->next;'],
        ['dll', '    target->next->prev = temp;'],
        ['free', '    delete target;'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void deleteAtPosition(int pos) {'],
        ['init', '    Node temp = head;'],
        ['loop', '    for (int i = 1; i < pos - 1; i++)'],
        ['advance', '        temp = temp.next;'],
        ['target', '    Node target = temp.next;'],
        ['link', '    temp.next = target.next;'],
        ['dll', '    target.next.prev = temp;'],
        ['free', '    target = null;'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def delete_at_position(self, pos):'],
        ['init', '    temp = self.head'],
        ['loop', '    for _ in range(1, pos - 1):'],
        ['advance', '        temp = temp.next'],
        ['target', '    target = temp.next'],
        ['link', '    temp.next = target.next'],
        ['dll', '    target.next.prev = temp'],
        ['free', '    del target']
      ],
      pseudo: [
        ['sig', 'PROCEDURE DeleteAtPosition(pos)'],
        ['init', '    temp <- head'],
        ['loop', '    FOR i <- 1 TO pos - 2'],
        ['advance', '        temp <- temp.next'],
        ['target', '    target <- temp.next'],
        ['link', '    temp.next <- target.next'],
        ['dll', '    target.next.prev <- temp'],
        ['free', '    FREE target'],
        ['end', 'END PROCEDURE']
      ]
    },

    search: {
      cpp: [
        ['sig', 'int search(int key) {'],
        ['init', '    Node* temp = head;'],
        ['pos', '    int position = 1;'],
        ['loop', '    while (temp != nullptr) {'],
        ['compare', '        if (temp->data == key)'],
        ['found', '            return position;'],
        ['advance', '        temp = temp->next;'],
        ['advance', '        position++;'],
        ['notfound', '    return -1;   // not found'],
        ['end', '}']
      ],
      java: [
        ['sig', 'int search(int key) {'],
        ['init', '    Node temp = head;'],
        ['pos', '    int position = 1;'],
        ['loop', '    while (temp != null) {'],
        ['compare', '        if (temp.data == key)'],
        ['found', '            return position;'],
        ['advance', '        temp = temp.next;'],
        ['advance', '        position++;'],
        ['notfound', '    return -1;   // not found'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def search(self, key):'],
        ['init', '    temp = self.head'],
        ['pos', '    position = 1'],
        ['loop', '    while temp:'],
        ['compare', '        if temp.data == key:'],
        ['found', '            return position'],
        ['advance', '        temp = temp.next'],
        ['advance', '        position += 1'],
        ['notfound', '    return -1   # not found']
      ],
      pseudo: [
        ['sig', 'FUNCTION Search(key) -> position'],
        ['init', '    temp <- head'],
        ['pos', '    position <- 1'],
        ['loop', '    WHILE temp != NULL'],
        ['compare', '        IF temp.data = key'],
        ['found', '            RETURN position'],
        ['advance', '        temp <- temp.next'],
        ['advance', '        position <- position + 1'],
        ['notfound', '    RETURN -1   (not found)'],
        ['end', 'END FUNCTION']
      ]
    },

    traverse: {
      cpp: [
        ['sig', 'void traverse() {'],
        ['init', '    Node* temp = head;'],
        ['loop', '    while (temp != nullptr) {'],
        ['visit', '        print(temp->data);'],
        ['advance', '        temp = temp->next;'],
        ['end', '    }'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void traverse() {'],
        ['init', '    Node temp = head;'],
        ['loop', '    while (temp != null) {'],
        ['visit', '        System.out.print(temp.data + " ");'],
        ['advance', '        temp = temp.next;'],
        ['end', '    }'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def traverse(self):'],
        ['init', '    temp = self.head'],
        ['loop', '    while temp:'],
        ['visit', '        print(temp.data)'],
        ['advance', '        temp = temp.next']
      ],
      pseudo: [
        ['sig', 'PROCEDURE Traverse'],
        ['init', '    temp <- head'],
        ['loop', '    WHILE temp != NULL'],
        ['visit', '        OUTPUT temp.data'],
        ['advance', '        temp <- temp.next'],
        ['end', 'END PROCEDURE']
      ]
    },

    traverseReverse: {
      cpp: [
        ['sig', 'void traverseReverse() {'],
        ['init', '    Node* temp = tail;'],
        ['loop', '    while (temp != nullptr) {'],
        ['visit', '        print(temp->data);'],
        ['advance', '        temp = temp->prev;'],
        ['end', '    }'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void traverseReverse() {'],
        ['init', '    Node temp = tail;'],
        ['loop', '    while (temp != null) {'],
        ['visit', '        System.out.print(temp.data + " ");'],
        ['advance', '        temp = temp.prev;'],
        ['end', '    }'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def traverse_reverse(self):'],
        ['init', '    temp = self.tail'],
        ['loop', '    while temp:'],
        ['visit', '        print(temp.data)'],
        ['advance', '        temp = temp.prev']
      ],
      pseudo: [
        ['sig', 'PROCEDURE TraverseReverse'],
        ['init', '    temp <- tail'],
        ['loop', '    WHILE temp != NULL'],
        ['visit', '        OUTPUT temp.data'],
        ['advance', '        temp <- temp.prev'],
        ['end', 'END PROCEDURE']
      ]
    },

    reverse: {
      cpp: [
        ['sig', 'void reverseList() {'],
        ['break', '    if (circular) tail->next = nullptr;   // open the circle'],
        ['prev0', '    Node* prev = nullptr;'],
        ['curr0', '    Node* current = head;'],
        ['loop', '    while (current != nullptr) {'],
        ['getnext', '        Node* next = current->next;'],
        ['flip', '        current->next = prev;'],
        ['dll', '        current->prev = next;   // doubly only'],
        ['moveprev', '        prev = current;'],
        ['movecur', '        current = next;'],
        ['endloop', '    }'],
        ['sethead', '    head = prev;'],
        ['reconnect', '    if (circular) tail->next = head;   // close the circle'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void reverseList() {'],
        ['break', '    if (circular) tail.next = null;   // open the circle'],
        ['prev0', '    Node prev = null;'],
        ['curr0', '    Node current = head;'],
        ['loop', '    while (current != null) {'],
        ['getnext', '        Node next = current.next;'],
        ['flip', '        current.next = prev;'],
        ['dll', '        current.prev = next;   // doubly only'],
        ['moveprev', '        prev = current;'],
        ['movecur', '        current = next;'],
        ['endloop', '    }'],
        ['sethead', '    head = prev;'],
        ['reconnect', '    if (circular) tail.next = head;   // close the circle'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def reverse_list(self):'],
        ['break', '    if self.tail: self.tail.next = None   # open the circle'],
        ['prev0', '    prev = None'],
        ['curr0', '    current = self.head'],
        ['loop', '    while current:'],
        ['getnext', '        next_node = current.next'],
        ['flip', '        current.next = prev'],
        ['dll', '        current.prev = next_node   # doubly only'],
        ['moveprev', '        prev = current'],
        ['movecur', '        current = next_node'],
        ['sethead', '    self.head = prev'],
        ['reconnect', '    if self.tail: self.tail.next = self.head   # close']
      ],
      pseudo: [
        ['sig', 'PROCEDURE ReverseList'],
        ['break', '    IF circular THEN tail.next <- NULL'],
        ['prev0', '    prev <- NULL'],
        ['curr0', '    current <- head'],
        ['loop', '    WHILE current != NULL'],
        ['getnext', '        next <- current.next'],
        ['flip', '        current.next <- prev'],
        ['dll', '        current.prev <- next   (doubly only)'],
        ['moveprev', '        prev <- current'],
        ['movecur', '        current <- next'],
        ['sethead', '    head <- prev'],
        ['reconnect', '    IF circular THEN tail.next <- head'],
        ['end', 'END PROCEDURE']
      ]
    },

    clear: {
      cpp: [
        ['sig', 'void clear() {'],
        ['loop', '    while (head != nullptr) {'],
        ['getnext', '        Node* next = head->next;'],
        ['free', '        delete head;'],
        ['sethead', '        head = next;'],
        ['end', '    }'],
        ['end', '}']
      ],
      java: [
        ['sig', 'void clear() {'],
        ['loop', '    while (head != null) {'],
        ['getnext', '        Node next = head.next;'],
        ['free', '        head = null;'],
        ['sethead', '        head = next;'],
        ['end', '    }'],
        ['end', '}']
      ],
      py: [
        ['sig', 'def clear(self):'],
        ['loop', '    while self.head:'],
        ['getnext', '        next_node = self.head.next'],
        ['free', '        self.head = None'],
        ['sethead', '        self.head = next_node']
      ],
      pseudo: [
        ['sig', 'PROCEDURE Clear'],
        ['loop', '    WHILE head != NULL'],
        ['getnext', '        next <- head.next'],
        ['free', '        FREE head'],
        ['sethead', '        head <- next'],
        ['end', 'END PROCEDURE']
      ]
    }
  };

  var complexityRows = [
    ['insertBegin', 'Insert at beginning', 'O(1)', 'O(1)'],
    ['insertEnd', 'Insert at end', 'O(n)', 'O(1)'],
    ['insertPos', 'Insert at position', 'O(n)', 'O(1)'],
    ['search', 'Search', 'O(n)', 'O(1)'],
    ['deleteBegin', 'Delete at beginning', 'O(1)', 'O(1)'],
    ['deleteEnd', 'Delete at end', 'O(n)', 'O(1)'],
    ['deletePos', 'Delete at position', 'O(n)', 'O(1)'],
    ['traverse', 'Traversal', 'O(n)', 'O(1)'],
    ['reverse', 'Reverse the list', 'O(n)', 'O(1)']
  ];

  var complexityNote =
    '<b>Why O(n) for the end?</b> In a singly linked list you must walk from the head to reach the last ' +
    'node — there is no shortcut. <b>With a tail pointer</b> (kept in doubly linked lists) insert-at-end and ' +
    'delete-at-end become <b>O(1)</b>, because we already know where the list finishes. A doubly linked list ' +
    'can also delete a known node in O(1) thanks to its <code>prev</code> link.';

  global.LLCode = {
    snippets: snippets,
    complexityRows: complexityRows,
    complexityNote: complexityNote
  };
})(typeof window !== 'undefined' ? window : globalThis);
