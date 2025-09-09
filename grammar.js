/**
 * @file Programming language targeting Juno: New Origins
 * @author Ryder Retzlaff <ryder@retzlaff.family>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  assign: 0,
  ternary: 1,
  logical_or: 2,
  logical_and: 3,
  comparison: 4,
  add_sub: 5,
  mul_div_mod: 6,
  unary: 7,
  as: 8,
  call_member: 9,
};

module.exports = grammar({
  name: "vessel",

  extras: $ => [$.comment, /\s/],
  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._declaration),

    _declaration: $ => choice(
      $.function_declaration,
      $.variable_declaration,
      $.event_handler,
      $.mutex_declaration,
      $.shared_block
    ),

    variable_declaration: $ => seq(
      optional('const'),
      field('type', $._type_specifier),
      field('name', alias($.identifier, $.variable_name)),
      '=',
      field('value', $._expression),
      ';'
    ),
    
    mutex_declaration: $ => seq('mutex', field('name', $.identifier), ';'),
    shared_block: $ => seq('shared', '(', field('mutex', $.identifier), ')', $.block_statement),

    event_handler: $ => seq(field('decorator', $.decorator), $.function_declaration),
    decorator: $ => seq('@', field('name', $.identifier)),

    function_declaration: $ => seq(
      optional('inline'),
      field('return_type', $._type_specifier),
      field('name', alias($.identifier, $.function_name)),
      field('parameters', $.parameter_list),
      field('body', $.block_statement),
    ),

    parameter_list: $ => seq('(', optional(commaSep1($.parameter)), ')'),
    parameter: $ => seq(
      field('type', $._type_specifier),
      field('name', alias($.identifier, $.parameter_name))
    ),

    _type_specifier: $ => choice($.primitive_type, alias($.identifier, $.type_identifier)),
    primitive_type: $ => choice('void', 'number', 'string', 'bool'),
    
    block_statement: $ => seq('{', repeat($._statement), '}'),

    _statement: $ => choice($.return_statement, $.expression_statement),
    expression_statement: $ => seq($._expression, ';'),
    return_statement: $ => seq('return', optional($._expression), ';'),
    
    _expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      $.call_expression,
      $.member_expression,
      $._primary_expression
    ),

    _primary_expression: $ => choice(
      $.identifier,
      $.number_literal,
      $.string_literal,
      $.interpolated_string_literal, // <-- Added here
      $.bool_literal,
      $.parenthesized_expression
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),
    
    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('!', '-')),
      field('argument', $._expression)
    )),
    
    binary_expression: $ => {
      const operators = [
        [prec.left, 'as', PREC.as],
        [prec.left, '+', PREC.add_sub],
        [prec.left, '-', PREC.add_sub],
        [prec.left, '*', PREC.mul_div_mod],
        [prec.left, '/', PREC.mul_div_mod],
        [prec.left, '==', PREC.comparison],
        [prec.left, '!=', PREC.comparison],
      ];
      return choice(...operators.map(([fn, op, precedence]) => fn(precedence, seq(
        field('left', $._expression),
        field('operator', op),
        field('right', $._expression)
      ))));
    },
    
    member_expression: $ => prec(PREC.call_member, seq(
      field('object', $._expression),
      '.',
      field('field', alias($.identifier, $.field_identifier))
    )),

    call_expression: $ => prec(PREC.call_member, seq(
      field('function', $._expression),
      field('arguments', $.argument_list)
    )),
    
    argument_list: $ => seq('(', optional(commaSep1($._expression)), ')'),
    
    // --- String interpolation rules ---
    interpolated_string_literal: $ => seq(
      '$',
      '"',
      repeat(choice(
        $._interpolated_string_content,
        $.interpolation
      )),
      '"'
    ),
    _interpolated_string_content: $ => token(prec(1, /[^"{\\]+/)),
    interpolation: $ => seq('{', $._expression, '}'),
    
    // --- Primitives ---
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    number_literal: $ => /\d+(\.\d+)?/,
    string_literal: $ => seq('"', /[^"]*/, '"'),
    bool_literal: $ => choice('true', 'false'),
    comment: $ => token(seq('//', /.*/)),
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
