/*
Module for Constraint definitions and TypeCheck support
 */

/**
 * Enumeration of basic types
 *
 * - see [stringFromValueType](#module_TypeCheck..stringFromValueType)
 * - see [valueTypeFromString](#module_TypeCheck..valueTypeFromString)
 */
export enum ValueType {
    none,
    number,
    string,
    boolean,
    object,
    array,
    regex
}

/**
 * Base for all Constraint errors.
 * Defines the identifying class archetype and consistent error message prefix
 */
class ConstraintError extends Error {
    constructor() {
        super()
        this.message = 'Constraint Error: '
    }
}

/**
 * An error message for when a value fails validation.
 */
class ConstraintFail extends ConstraintError {
    constructor(failType:string, value:any) {
        super();
        this.message += `Failed ${failType}: ${value}`
    }
}

/**
 * An error for when the basic type is wrong
 */
class ConstraintBasicTypeError extends ConstraintError {
    constructor(value:any, expType:string) {
        super();
        this.message += `Incorrect type ${typeof value}, (${expType} expected) ${value}`
    }
}

/**
 * An error for when we expected null or undefined
 */
// class NullConstraintError extends ConstraintError {
//     constructor() {
//         super();
//         this.message += 'Expected NULL or undefined'
//     }
// }

/**
 * An error for when a min/max range has been violated, including what type of range.
 */
class RangeConstraintError extends ConstraintError {
    constructor(value:number, comp:number, rangeType:string = 'Number') {
        super();
        // we don't need to test both range ends, because we know we are here because of an error one way
        // or the other.
        if (value < comp) {
            this.message += `${rangeType} ${value} is less than range minimum of ${comp}`
        } else {
            this.message += `${rangeType} ${value} exceeds range maximum of ${comp}`
        }
    }
}

/**
 * An error for when an integer was expected
 */
class IntegerConstraintError extends ConstraintError {

    constructor(value:any) {
        super();
        if(value === undefined) {
            this.message += `Integer expected`
        } else {
            this.message += `Value ${value} is not an integer`
        }
    }
}

/**
 * An error for when a positive value was expected
 */
class PositiveConstraintError extends ConstraintError {
    constructor(value:any) {
        super();
        if(value === undefined) {
            this.message += `Positive value expected`
        } else {
            this.message += `Value ${value} is not positive`
        }
    }
}

/**
 * An error for when a negative value was expected
 */
class NegativeConstraintError extends ConstraintError {
    constructor(value:any) {
        super();
        if(value === undefined) {
            this.message += `Positive value expected`
        } else {
            this.message += `Value ${value} is not negative`
        }
    }
}

/**
 * An error for when zero was not expected.
 */
class ZeroValueConstraintError extends ConstraintError {
    constructor() {
        super();
        this.message += 'Zero is not an allowable value'
    }
}

/**
 * An error for declaring both ! and not ! variants of the same expression
 */
class ConstraintConflictError extends ConstraintError {
    constructor(conflictType:string) {
        super();
        this.message += `Both ${conflictType} and !${conflictType} declared`
    }
}

/**
 * Base form of TypeConstraint.
 * Defines the base type and the test method.
 */
export class TypeConstraint {
    /** The type this constraint applies to */
    public readonly type:string;

    public badName?:string; // defined only if we encounter an unrecognized constraint keyword

    /** a freeform note that appears in comments. No runtime verification. */
    public note?:string

    constructor(typeString:string = '') {
        this.type = typeString.trim().toLowerCase()
    }

    /**
     * Perform a runtime test of the value

     * returns without throw if test was okay, otherwise throws a ConstraintError explaining the violation.
     *
     * @param value - value to test against this constraint
     *
     * @throws {ConstraintError} Error is thrown if test fails its constraints
     */
    test(value:any):void | never  {
        if(typeof value !== this.type) {
            throw new ConstraintBasicTypeError(value, this.type)
        }
    }

    // Describes the constraint in printable terms (not really used, a bit redundant to describe)
    toString() {
        if(this.badName) return `"${this.badName}" is not a recognized constraint for ${this.type}`
        if(this.note) return this.note;
        return `- No Constraint`
    }
    // describe the constraints in human terms.
    describe() {
        if(this.badName) return `"${this.badName}" is not a recognized constraint for ${this.type}`
        if(this.note) return this.note;
        return 'No Constraint'
    }
}

// /**
//  * Enumeration of recognized status for a parameter or return constraint
//  */
// enum ConstraintStatus {
//     None = "",       // not parsed
//     NotConstraint = "NotConstraint", // doesn't start with '-', treat as description
//     Error = "Error",     // parsing error
//     NotProvided = "NotProvided", // no constraint block
//
//
// }

/**
 *  Null only applies to objects.
 */
// class NullConstraint extends TypeConstraint {
//     test(value) {
//         if(value || typeof value !== 'object') {
//             throw new NullConstraintError()
//         }
//     }
// }

/**
 * Constraints recorded on a number
 * Integer, Positive, Negative, NotZero, min, max
 */
class NumberConstraint extends TypeConstraint {
    public min?:number; // min range
    public max?:number; // max range, inclusive
    public maxx?:number; // max, exclusive
    public isInteger?:boolean = false;  // number must be an integer
    public isPositive?:boolean = false; // number must be positive
    public isNegative?:boolean = false; // number must be negative
    public notZero?:boolean = false;    // number must not be zero

    constructor() {
        super('number')
    }
    test(value:any) {
        super.test(value)
        if(this.isInteger) {
            if(Math.floor(value) !== value) {
                throw new IntegerConstraintError(value)
            }
        }
        if(this.notZero) {
            if(value === 0) {
                throw new ZeroValueConstraintError()
            }
        }
        if(this.isPositive && this.isNegative) {
            throw new ConstraintConflictError('positive')
        }
        if(this.isPositive) {
            if(value < 0) {
                throw new PositiveConstraintError(value)
            }
        }
        if(this.isNegative) {
            if(value < 0) {
                throw new NegativeConstraintError(value)
            }
        }
        if(this.min !== undefined) {
            if(value < this.min) {
                throw new RangeConstraintError(value, this.min)
            }
        }
        if(this.max !== undefined) {
            if(value > this.max) {
                throw new RangeConstraintError(value, this.max)
            }
        }
        if(this.maxx !== undefined) {
            if(value >= this.maxx) {
                throw new RangeConstraintError(value, this.maxx)
            }
        }
    }

    toString() {
        const keys:string[] = []
        if(this.isInteger) keys.push('Integer')
        if(this.notZero) keys.push('Not Zero')
        if(this.isPositive) keys.push('Positive')
        if(this.isNegative) keys.push('Negative')
        if(this.min !== undefined) keys.push(`Min = ${this.min}`)
        if(this.max !== undefined) keys.push(`Max = ${this.max}`)
        if(this.maxx !== undefined) keys.push(`Maxx = ${this.maxx}`)
        if(this.note) keys.push(this.note)
        return keys.length ? '- '+keys.join(',') : super.toString()
    }
    describe(): string {
        const keys:string[] = []
        if(this.isInteger) keys.push('number must be an integer')
        if(this.notZero) keys.push('number must not be zero')
        if(this.isPositive) keys.push('number must be positive')
        if(this.isNegative) keys.push('number must be negative')
        if(this.min !== undefined) keys.push(`Minimum value is ${this.min}`)
        if(this.max !== undefined) keys.push(`Maximum value is ${this.max}`)
        if(this.maxx !== undefined) keys.push(`Maximum value is less than ${this.maxx}`)
        if(this.note || this.badName) keys.push(super.describe())
        return keys.length ? keys.join('\n') : super.describe()

    }

}

/**
 * Constraints recorded on a string
 * minLength, maxLength, (!)startsWith, (!)endsWith, (!)contains, (!)match
 */
class StringConstraint extends TypeConstraint {
    public minLength?: number; // minimum length of allowed string
    public maxLength?: number; // maximum length of allowed string
    public startsWith?: string; // string must start with this substring
    public notStartsWith?: string; // string must not start with this substring
    public endsWith?: string; // string must end with this substring
    public notEndsWith?: string; // string must not end with this substring
    public contains?:string; // string contains this substring
    public notContains?:string; // string does not contain this substring
    public match?:string; // regular expression (as string) that must be matched
    public notMatch?:string; // regular expression (as string) that must not be matched

    constructor() {
        super('string')
    }
    test(value:any) {
        super.test(value)
        if(this.minLength) {
            if(value.length < this.minLength) {
                throw new RangeConstraintError(value.length, this.minLength, 'String Length')
            }
        }
        if(this.maxLength) {
            if(value.length > this.maxLength) {
                throw new RangeConstraintError(value.length, this.maxLength, 'String Length')
            }
        }
        if(this.startsWith && this.notStartsWith) {
            throw new ConstraintConflictError('startsWith')
        }
        if(this.startsWith || this.notStartsWith) {
            let comp = this.startsWith || this.notStartsWith || ''
            let not = !!this.notStartsWith
            if(value.substring(0, comp.length) === comp) {
                if(not) throw new ConstraintFail('!startsWith', value)
            } else {
                if(!not) throw new ConstraintFail('startsWith', value)
            }
        }
        if(this.endsWith && this.notEndsWith) {
            throw new ConstraintConflictError('endsWith')
        }
        if(this.endsWith || this.notEndsWith) {
            let comp = this.endsWith || this.notEndsWith || ''
            let not = !!this.notEndsWith
            if(value.substring(value.length - comp.length) === comp) {
                if(not) throw new ConstraintFail('!endsWith', value)
            } else {
                if(!not) throw new ConstraintFail('endsWith', value)
            }
        }
        if(this.contains && this.notContains) {
            throw new ConstraintConflictError('contains')
        }
        if(this.contains || this.notContains) {
            let comp = this.contains || this.notContains
            let not = !!this.notContains
            if(value.indexOf(comp) !== -1) {
                if(not) throw new ConstraintFail('!contains', value)
            } else {
                if(!not) throw new ConstraintFail('contains', value)
            }
        }
        if(this.match && this.notMatch) {
            throw new ConstraintConflictError('match')
        }
        if(this.match || this.notMatch) {
            let comp = this.match || this.notMatch
            let not = !!this.notMatch
            let re = new RegExp(comp || '')
            if( re.test(value) ) {
                if(not) throw new ConstraintFail('!match', value)
            } else {
                if(!not) throw new ConstraintFail('match', value)
            }
        }
    }
    toString() {
        const keys:string[] = []
        if(this.minLength) keys.push(`Min Length = ${this.minLength}`)
        if(this.maxLength) keys.push(`Max Length = ${this.maxLength}`)
        if(this.startsWith) keys.push(`Starts With = ${this.startsWith}`)
        if(this.notStartsWith) keys.push(`!StartsWith = ${this.startsWith}`)
        if(this.endsWith) keys.push(`Ends With = ${this.endsWith}`)
        if(this.notEndsWith) keys.push(`!EndsWith = ${this.endsWith}`)
        if(this.contains) keys.push(`Contains = ${this.contains}`)
        if(this.notContains) keys.push(`!Contains = ${this.notContains}`)
        if(this.match) keys.push(`Match = ${this.match}`)
        if(this.notMatch) keys.push(`!Match = ${this.notMatch}`)
        if(this.note) keys.push(this.note)
        return keys.length ? '- '+keys.join(',') : super.toString()
    }
    describe() {
        const keys:string[] = []
        if(this.minLength) keys.push(`string must be at least ${this.minLength} characters long`)
        if(this.maxLength) keys.push(`string must consist of less than ${this.maxLength} characters`)
        if(this.startsWith) keys.push(`string must start with "${this.startsWith}"`)
        if(this.notStartsWith) keys.push(`string must NOT start with "${this.startsWith}"`)
        if(this.endsWith) keys.push(`string must end with "${this.endsWith}"`)
        if(this.notEndsWith) keys.push(`string must NOT end with "${this.endsWith}"`)
        if(this.contains) keys.push(`must contain substring "${this.contains}"`)
        if(this.notContains) keys.push(`must NOT contain substring "${this.notContains}"`)
        if(this.match) keys.push(`must match Regular Expression "${this.match}"`)
        if(this.notMatch) keys.push(`must NOT match RegExp "${this.notMatch}"`)
        if(this.note || this.badName) keys.push(super.describe())
        return keys.length ? keys.join('\n') : super.describe()
    }

}

/**
 * Constraints recorded on an object
 * (!)empty, (!)hasProperties, notNested, noPrototype, canSerialize, noUndefinedProps
 */
class ObjectConstraint extends TypeConstraint {
    public empty?:boolean; // object must have no properties
    public notEmpty?:boolean; // object must have some properties
    public hasProperties?:string[] // object must have these specific properties defined
    public notHasProperties?:string[] // object must note have these specific properties defined
    public notNested?:boolean // object must not contain object members (arrays are okay)
    public noPrototype?:boolean // object must not have a prototype other than Object.
    public canSerialize?:boolean // object must survive standard js (structured clone) serialization (i.e. stringify w/o error)
    public noFalseyProps?:boolean // all property values must evaluate at truthy
    public noTruthyProps?:boolean // all property values must evaluate as falsey
    public instanceOf?:string // object must have been constructed as this object name
    public notInstanceOf?: string // object must not be of this instance type name

    constructor() {
        super('object')
    }
    test(value:any) {
        super.test(value)

        if(this.empty && this.notEmpty) {
            throw new ConstraintConflictError('empty')
        }
        if(this.hasProperties && this.notHasProperties) {
            let collisions:string[] = []
            for(let has of this.hasProperties) {
                if(this.notHasProperties.indexOf(has) !== -1) {
                    collisions.push(has)
                }
            }
            if(collisions.length) {
                throw new ConstraintConflictError('hasProperties "'+collisions.join(',')+'"')
            }
        }
        if(this.empty) {
            if(Object.getOwnPropertyNames(value).length) {
                throw new ConstraintFail('empty', 'object contains '+Object.getOwnPropertyNames(value).length+' props')
            }
        }
        if(this.notEmpty) {
            if(!Object.getOwnPropertyNames(value).length) {
                throw new ConstraintFail('!empty', value)
            }
        }
        if(this.hasProperties) {
            for(let has of this.hasProperties) {
                if(!value.hasOwnProperty(has)) {
                    throw new ConstraintFail('hasProperties', has)
                }
            }
        }
        if(this.notHasProperties) {
            for(let hasnot of this.notHasProperties) {
                if(value.hasOwnProperty(hasnot)) {
                    throw new ConstraintFail('!hasProperties', hasnot)
                }
            }
        }
        if(this.notNested) {
            for(let p of Object.getOwnPropertyNames(value)) {
                let v = value[p]
                if(typeof v === 'object') {
                    if(!Array.isArray(v)) {
                        throw new ConstraintFail('notNested', p)
                    }
                }
            }
        }
        if(this.noPrototype) {
            let prot = Object.getPrototypeOf(value)
            let name = prot && prot.constructor.name
            if(name && name !=='Object') {
                throw new ConstraintFail('noPrototype', value)
            }
        }
        if(this.canSerialize) {
            let json;
            try {
                json = JSON.stringify(value)
            } catch(e) {
            }
            if(!json) {
                throw new ConstraintFail('canSerialize', value)
            }

        }
        if(this.noFalseyProps) {
            for(let p of Object.getOwnPropertyNames(value)) {
                let v = value[p]
                if(!v) {
                    throw new ConstraintFail('noFalseyProps', p)
                }
            }
        }
        if(this.noTruthyProps) {
            for(let p of Object.getOwnPropertyNames(value)) {
                let v = value[p]
                if(v) {
                    throw new ConstraintFail('noTruthyProps', p)
                }
            }

        }
        if(this.instanceOf) {
            if(value.constructor.name !== this.instanceOf) {
                throw new ConstraintFail('instanceOf ('+this.instanceOf+')', value.constructor.name)
            }
        }
        if(this.notInstanceOf) {
            if(value.constructor.name === this.notInstanceOf) {
                throw new ConstraintFail('!instanceOf', this.notInstanceOf)
            }

        }
     }
    toString() {
        const keys:string[] = []
        if(this.empty) keys.push(`Empty`)
        if(this.notEmpty) keys.push(`!Empty`)
        if(this.hasProperties) keys.push(`Has Properties =${this.hasProperties.join(',')}`)
        if(this.notHasProperties) keys.push(`!Has Properties =${this.notHasProperties}`)
        if(this.notNested) keys.push(`Not Nested`)
        if(this.noPrototype) keys.push(`No Prototype`)
        if(this.canSerialize) keys.push(`Can Serialize`)
        if(this.noFalseyProps) keys.push(`No Falsey Props`)
        if(this.noTruthyProps) keys.push(`No Truthy Props`)
        if(this.instanceOf) keys.push(`Instance Of = ${this.instanceOf}`)
        if(this.notInstanceOf) keys.push(`Not an instance of ${this.notInstanceOf}`)
        if(this.note) keys.push(this.note)
        return keys.length ? '- '+keys.join(',') : super.toString()
    }
    describe() {
        const keys:string[] = []
        if(this.empty) keys.push(`object must be empty`)
        if(this.notEmpty) keys.push(`object must not be empty`)
        if(this.hasProperties) keys.push(`object must contain properties "${this.hasProperties.join(',')}"`)
        if(this.notHasProperties) keys.push(`object must not contain properties "${this.notHasProperties.join(',')}"`)
        if(this.notNested) keys.push(`object must not contain nested objects`)
        if(this.noPrototype) keys.push(`object must not derive from a prototype`)
        if(this.canSerialize) keys.push(`object can be serialized`)
        if(this.noFalseyProps) keys.push(`object can contain no properties that evaluate as false`)
        if(this.noTruthyProps) keys.push(`object can contain no properties that evaluate as true`)
        if(this.instanceOf) keys.push(`object must be an instance of "${this.instanceOf}"`)
        if(this.notInstanceOf) keys.push(`object must not be an instance of "${this.notInstanceOf}"`)
        if(this.note || this.badName) keys.push(super.describe())
        return keys.length ? keys.join('\n') : super.describe()
    }

}

/**
 * Enumeration of checkType parsed results.
 *
 * parameters (p1, p2) are parsed at same time, and meaning does vary per checkType.
 */
export enum ElementCheckType {
    none,   // don't test the elements
    all,    // test all the elements
    random, // test up to a given number (p1) of elements, randomly chosen
    step,   // test every (p1) elements
    first,  // test all up to (p1) elements, then stop
    last,   // test all of the last (p1) elements
    firstThenLast, // Test the first (p1) elements, and the last (p2) elements
    firstThenStep, // test all up to (p1) elements, then every (p2) thereafter
    firstThenRandom// test all up to (p1) elements, then up to (p2) of the remaining, chosen at random
}

/**
 * Constraints recorded on an array
 * minLength, maxLength, (!)contains, checkType, each
 */
class ArrayConstraint extends TypeConstraint {
    public minLength?: number; // minimum array length
    public maxLength?: number; // maximum array length
    public contains?: any; // at least one element must be of this value
    public notContains?: any // no elements can be of this value
    public elementConstraints: TypeConstraint[] = [] // elements are tested for compliance under these rules
    public elementCheckType: ElementCheckType  = ElementCheckType.none // defines the extent of runtime coverage on elements
    public elementCheckParameter: number = 0 // defined by elementCheckType
    public elementCheckParameter2: number = 0 // defined by elementCheckType
    constructor() {
        super('array')
    }
    test(value:any) {
        if(!Array.isArray(value)) {
            throw new ConstraintBasicTypeError(value,'array')
        }
        let length = value.length
        if(this.minLength) {
            if(length < this.minLength) {
                throw new RangeConstraintError(length, this.minLength, 'Array Length')
            }
        }
        if(this.maxLength) {
            if(length > this.maxLength) {
                throw new RangeConstraintError(length, this.maxLength, 'Array Length')
            }
        }
        if(this.contains && this.notContains) {
            throw new ConstraintConflictError('contains')
        }
        if(this.contains || this.notContains) {
            let comp = this.contains || this.notContains
            let not = !!this.notContains
            if(value.indexOf(comp) !== -1) {
                if(not) throw new ConstraintFail('!contains', this.notContains)
            } else {
                if(!not) throw new ConstraintFail('contains', this.contains)
            }
        }
        if(this.elementConstraints || this.elementCheckType) {
            let checkType = this.elementCheckType === undefined ? ElementCheckType.all : this.elementCheckType
            let i = 0;
            let count = 0;
            let step = 1;
            let firstCount = 0;;
            let thenCount = 0;
            let counting = false;
            let tested:any = {}
            switch(checkType) {
                case ElementCheckType.none:
                    firstCount = 0;
                    thenCount = 0;
                    counting = false;
                    break;
                case ElementCheckType.all:
                    firstCount = length;
                    step = 1;
                    thenCount = 0;
                    counting = true;
                    break;
                case ElementCheckType.first:
                    firstCount = parseInt(''+this.elementCheckParameter)
                    step = 1;
                    thenCount = 0;
                    counting = true;
                    break;
                case ElementCheckType.last:
                    firstCount = 0;
                    step = 1;
                    thenCount = length - this.elementCheckParameter
                    counting = false;
                    break;
                case ElementCheckType.firstThenLast:
                    firstCount = parseInt(''+this.elementCheckParameter)
                    thenCount = length - this.elementCheckParameter
                    if(thenCount < 0) thenCount = length;
                    step = 1;
                    counting = true;
                    break;
                case ElementCheckType.step:
                    firstCount = length;
                    thenCount = 0;
                    counting = true;
                    step = parseInt(''+this.elementCheckParameter)
                    break;
                case ElementCheckType.random:
                    firstCount = 0;
                    thenCount = parseInt(''+this.elementCheckParameter)
                    step = 0;
                    counting = true;
                    break;
                case ElementCheckType.firstThenStep:
                    firstCount = parseInt(''+this.elementCheckParameter)
                    thenCount = length - firstCount
                    step = parseInt(''+this.elementCheckParameter2)
                    counting = true;
                    break;
                case ElementCheckType.firstThenRandom:
                    firstCount = parseInt(''+this.elementCheckParameter)
                    thenCount = parseInt(''+this.elementCheckParameter2)
                    step = 0
                    counting = true;
                    break;
            }
            while(i < length) {
                if(counting) {
                    let ev = value[i]
                    let t:string = typeof ev
                    if(Array.isArray(ev)) t = 'array'
                    let m = (this.elementConstraints as unknown as Map<string, TypeConstraint>)
                    let c = m && m.get(t)
                    let tc = c || parseConstraints(t, '')
                    if(tc) tc.test(ev)
                    count++
                }
                if((checkType === ElementCheckType.last || checkType === ElementCheckType.firstThenLast) && i === thenCount) {
                    counting = true
                }
                if(checkType === ElementCheckType.firstThenLast && i === firstCount) {
                    counting = false
                }

                if(count >= firstCount) {
                    if(count >= firstCount+thenCount) {
                        break
                    }
                }
                if(step) {
                    i += step
                } else {
                    while(true) {
                        let rr = Math.floor(Math.random() * (length-count))
                        i = count+rr
                        if(i < length && !tested[i]) {
                            tested[i] = true
                            break;
                        }
                    }
                }
            }
        }
    }
    toString() {
        const keys:string[] = []
        if(this.minLength) keys.push(`Min Length = ${this.minLength}`)
        if(this.maxLength) keys.push(`Max Length = ${this.maxLength}`)
        if(this.contains) keys.push(`Contains = ${this.contains}`)
        if(this.notContains) keys.push(`!Contains = ${this.notContains}`)
        if(this.elementConstraints) keys.push(`each element of the array has the following constraints by type ${listEachConstraints(this.elementConstraints)}`)
        if(this.elementCheckType) keys.push(`(elements will be tested using the ${checkTypeToString(this.elementCheckType,this.elementCheckParameter,this.elementCheckParameter2)} method)`)
        if(this.note) keys.push(this.note)
        return keys.length ? '- '+keys.join(',') : super.toString()
    }
    describe() {
        const keys:string[] = []
        if(this.minLength) keys.push(`array must contain at least ${this.minLength} elements`)
        if(this.maxLength) keys.push(`array must contain no more than ${this.maxLength} elements`)
        if(this.contains) keys.push(`array must contain element value "${this.contains}"`)
        if(this.notContains) keys.push(`array must not contain an element value "${this.notContains}"`)
        if(this.elementConstraints) keys.push(`each element of the array has the following constraints by type ${listEachConstraints(this.elementConstraints)}`)
        if(this.elementCheckType) keys.push(`(elements will be tested using the ${checkTypeToString(this.elementCheckType,this.elementCheckParameter,this.elementCheckParameter2)} method)`)
        if(this.note || this.badName) keys.push(super.describe())
        return keys.length ? keys.join('\n') : super.describe()
    }
}

function listEachConstraints(cmap:any) {
    let out = ''
    let types = cmap.keys()
    let entries = cmap.entries()
    let entry;
    while((entry = entries.next().value)) {
        out += '<br/><b>'+entry[0]+ ' elements:</b><br/>&nbsp;&nbsp; -'
        out += entry[1].describe().replace(/\n/g, '<br/>&nbsp;&nbsp; - ')
    }
    return out
}

/**
 * Translates a type string (number, string, boolean, object, array, regex) into the corresponding ValueType enum
 * Note that strings beside none, array, and regex are synonymous with the `typeof` operator value
 * @param str
 */
export function valueTypeFromString(str:string): ValueType {

    switch(str.trim().toLowerCase()) {
        default: return str.trim().length ? str.indexOf('[]') !== -1 ? ValueType.array : ValueType.object : ValueType.none;
        case 'number': return ValueType.number;
        case 'string': return ValueType.string;
        case 'boolean': return ValueType.boolean;
        case 'object': return ValueType.object;
        case 'array': return ValueType.array;
        case 'regex': return ValueType.regex;
        case 'regexp': return ValueType.regex;
    }
}

/**
 * Translates a ValueType enum value into the corresponding string.
 * Note that strings beside none, array, and regex are synonymous with the `typeof` operator value
 * @param vt
 */
export function stringFromValueType(vt:ValueType): string {

    switch(vt) {
        case ValueType.none: return ''
        case ValueType.number: return 'number'
        case ValueType.string: return 'string'
        case ValueType.boolean: return 'boolean'
        case ValueType.object: return 'object'
        case ValueType.array: return 'array'
        case ValueType.regex: return 'regex'
    }
}

/**
 * Read either a value or a list from an expression value
 * @param str
 */
function constraintListParse(str = '') {
    str.trim()
    if(str.charAt(0) === '"' || str.charAt(0) === "'") {
        str = str.substring(1, str.length-1)
    }
    if(str.indexOf(',') !== -1) {
        return str.split(',') // return the split array
    }
    if (isFinite(Number(str))) {
        return Number(str)
    }
    return str; // return the unquoted string value
}

/**
 * Used to parse the type+constraints blocks from an "each" directive list
 * @param str
 */
function eachListParse(str = '') {
    let map = new Map<string, TypeConstraint>()
    let esplit = str.split('|')
    for(let tblock of esplit) {
        let ci = tblock.indexOf(',')
        if(ci !== -1) {
            let type = tblock.substring(0, ci).trim()
            let cdef = tblock.substring(ci+1)
            let constraint = parseConstraints(type, cdef) || new TypeConstraint()
            map.set(type, constraint)
        }
    }
    return map
}


/**
 * Parse out the checkType and return the resulting type name and the parsed parameters in a structure.
 * @param ctStr
 * @return {{string}name,{number}[p1],{number}[p2]}
 */
function parseCheckType(ctStr:string = ''): {name:string, p1?:number, p2?:number} {
    let opi = ctStr.indexOf('(')
    if(opi === -1) opi = ctStr.length
    let name = ctStr.substring(0,opi)
    let cpi = ctStr.indexOf(')', opi)
    if(cpi === -1) cpi = ctStr.length;
    let p = ctStr.substring(opi+1, cpi).split(',')
    let p1:any, p2:any
    try {
        p1 = p[0] && parseInt(p[0])
        p2 = p[1] && parseInt(p[1])
    } catch(e) {}
    return {name, p1, p2}
}

function checkTypeToString(ct:ElementCheckType, p1?:number|string, p2?:number|string) {
    switch(ct) {
        case ElementCheckType.random:
            return `random(${p1})`
        case ElementCheckType.step:
            return `step(${p1})`
        case ElementCheckType.first:
            return `first(${p1})`
        case ElementCheckType.last:
            return `last(${p1})`
        case ElementCheckType.firstThenLast:
            return `firstThenLast(${p1},${p2})`
        case ElementCheckType.firstThenStep:
            return `firstThenStep(${p1},${p2})`
        case ElementCheckType.firstThenRandom:
            return `firstThenRandom(${p1},${p2})`
        case ElementCheckType.none:
            return 'none'
        default:
        case ElementCheckType.all:
            return 'all'
    }
}
function checkTypeFromString(ctstr:string) : ElementCheckType {
    switch(ctstr.trim().toLowerCase()) {
        case 'random': return ElementCheckType.random;
        case 'step': return ElementCheckType.step;
        case 'first': return ElementCheckType.first;
        case 'last': return ElementCheckType.last;
        case 'firstthenlast': return ElementCheckType.firstThenLast;
        case 'firstthenstep': return ElementCheckType.firstThenStep;
        case 'firstthenrandom': return ElementCheckType.firstThenRandom;
        case 'none': return ElementCheckType.none
        default:
        case 'all': return ElementCheckType.all
    }
}

// parse constraints from what may be more than one type (e.g. string|number)
export function parseConstraintsToMap(typeString:string, blockSet:string= ''): Map<string, TypeConstraint> {
    let map = new Map<string, TypeConstraint>()
    let types = typeString.split('|')
    let blocks = blockSet.split(',')
    for(let type of types) {
        type = (type||'').trim()
        let constraint = parseConstraints(type, blockSet) || new TypeConstraint()
        map.set(type, constraint)
    }
    return map
}

/**
 * Given a block of text, parse as constraints and return the set if this is a constraint declaration
 * otherwise, return ConstraintStatus.NotConstraint  to signify this is a description block and not a constraint declaration
 * @param type - the type parsed from the param or return declaration
 * @param block - the block of text to evaluate
 * @param delim - the split delimiter (defaults to ',')
 */
export function parseConstraints(type:string, block:string, delim=','):TypeConstraint | undefined {

    let constraint;
    if(!block || !type) return;
    let valueType = valueTypeFromString(type)
    let cblock = block.trim()
    // get any constraint parameters
    let fpi = cblock.indexOf('(')
    while(fpi !== -1) {
        let cpi = cblock.indexOf(')', fpi)
        if(cpi === -1) cpi = cblock.length;
        let swap = cblock.substring(fpi, cpi).replace(/,/g, ';;')
        cblock = cblock.substring(0,fpi) + swap + cblock.substring(cpi)
        fpi = cblock.indexOf('(', cpi)
    }

    const expressions = cblock .split(delim)
    for(let expr of expressions) {
        let expVal;
        let params;
        let not = false;
        expr = expr.trim()
        if(!expr.startsWith('match') && !expr.startsWith("!match")) {
            let cpi = expr.indexOf('(')
            if (cpi !== -1) {
                params = expr.substring(cpi).replace(/;;/g, ',').trim()
                if (params.charAt(0) === '(') params = params.substring(1)
                if (params.charAt(params.length - 1) === ')') params = params.substring(0, params.length - 1)
                expr = expr.substring(0, cpi).trim()
                if (expr === 'each') {
                    expVal = eachListParse(params)
                } else {
                    expVal = constraintListParse(params)
                }
            }
        }
        if(expr.charAt(0) === '!') {
            not = true;
            expr = expr.substring(1)
        }
        if(expr.indexOf('=') !== -1) {
            let p = expr.split('=')
            if(p.length > 2) {
                p[1] = p.slice(1).join('=')
            }
            expr = p[0].trim()
            if(expr === 'each') {
                expVal = eachListParse(p[1])
            } else {
                expVal = constraintListParse(p[1])
            }

        }
        expr = expr.trim().toLowerCase()
        switch (valueType) {
            case ValueType.number:
                constraint = (constraint as NumberConstraint) || new NumberConstraint()
                switch(expr) {
                    case 'noconstraint':
                    case 'no constraint':
                        return constraint; // early exit if we encounter "- No Constraint"

                    /* Integer, Positive, Negative, NotZero, min, max */
                    case 'integer':
                        constraint.isInteger = true;
                        break;
                    case 'positive':
                        constraint.isPositive = true;
                        break;
                    case 'negative':
                        constraint.isNegative = true;
                        break;
                    case 'notzero':
                    case 'not zero':
                    case 'nonzero':
                        constraint.notZero = true;
                        break;
                    case 'min':
                        constraint.min = expVal as number;
                        break;
                    case 'max':
                        constraint.max = expVal as number;
                        break;
                    case 'maxx':
                        constraint.maxx = expVal as number;
                        break;

                    case 'note':
                        constraint.note = expVal as string
                        break;
                    default:
                        constraint.badName = expr
                        break;
                }

                break;
            case ValueType.string:
                // minLength, maxLength, (!)startsWith, (!)endsWith, (!)contains,  (!)match
                constraint = (constraint as StringConstraint) || new StringConstraint()
                switch(expr) {
                    case 'noconstraint':
                    case 'no constraint':
                        return constraint; // early exit if we encounter "- No Constraint"

                    case 'minlength':
                        constraint.minLength = expVal as number
                        break;
                    case 'maxlength':
                        constraint.maxLength = expVal as number
                        break;
                    case 'startswith':
                        not ? constraint.notStartsWith = expVal as string : constraint.startsWith = expVal as string
                        break;
                    case 'endswith':
                        not ? constraint.notEndsWith = expVal as string: constraint.endsWith = expVal as string
                        break;
                    case 'contains':
                        not ? constraint.notContains = expVal as string : constraint.contains = expVal as string
                        break;
                    case 'match':
                        not ? constraint.notMatch = expVal as string: constraint.match = expVal as string
                        break;
                    case 'note':
                        constraint.note = expVal as string
                        break;
                    default:
                        constraint.badName = expr
                        break;
                }
                break;
            case ValueType.object:
                //(!)empty, (!)hasProperties, notNested, noPrototype, canSerialize, noUndefinedProps
                constraint = (constraint as ObjectConstraint) || new ObjectConstraint()
                switch(expr) {
                    case 'noconstraint':
                    case 'no constraint':
                        return constraint; // early exit if we encounter "- No Constraint"

                    case 'empty':
                        constraint.empty = !not;
                        constraint.notEmpty = not;
                        break;
                    case 'hasproperties':
                    case 'has properties':
                        if(typeof expVal === 'string') expVal = [expVal]
                        not ? constraint.notHasProperties = expVal as string[] : constraint.hasProperties = expVal as string[]
                        break;
                    case 'notnested':
                    case 'not nested':
                        constraint.notNested = true;
                        break;
                    case 'noprototype':
                    case 'no prototype':
                        constraint.noPrototype = true;
                        break;
                    case 'canserialize':
                    case 'can serialize':
                        constraint.canSerialize = true;
                        break;
                    case 'notruthyprops':
                    case 'no truthy props':
                        constraint.noTruthyProps = true;
                        break;
                    case 'nofalseyprops':
                    case 'no falsey props':
                        constraint.noFalseyProps = true;
                        break;
                    case 'instanceof':
                    case 'instance of':
                        if(not) constraint.notInstanceOf = expVal as string
                        else constraint.instanceOf = expVal as string
                        break;
                    case 'note':
                        constraint.note = expVal as string
                        break;
                    default:
                        constraint.badName = expr
                        break;

                }
                break;
            case ValueType.array:
                // minLength, maxLength, (!)contains, each:
                constraint = (constraint as ArrayConstraint) || new ArrayConstraint()
                switch(expr) {
                    case 'noconstraint':
                    case 'no constraint':
                        return constraint; // early exit if we encounter "- No Constraint"

                    case 'minlength':
                    case 'min length':
                        constraint.minLength = expVal as number
                        break;
                    case 'maxlength':
                    case 'max length':
                        constraint.maxLength = expVal as number
                        break;
                    case 'contains':
                        not ? constraint.notContains = expVal as string : constraint.contains = expVal as string
                        break;
                    case 'checktype':
                    case 'check type':
                        let psplit = (params || '').split(',')
                        const pct = parseCheckType(''+expVal)
                        constraint.elementCheckType = checkTypeFromString(pct.name)
                        constraint.elementCheckParameter = (psplit[0] || pct.p1) as number
                        constraint.elementCheckParameter2 = (psplit[1] || pct.p2) as number
                        break;
                    case 'each':
                        let type = 'any'
                        constraint.elementConstraints = expVal as any
                        break;
                    case 'note':
                        constraint.note = expVal as string
                        break;
                    default:
                        constraint.badName = expr
                        break;
                }
                break;
            default: // none, boolean, regex
                if(expr === 'no constraint') return;
                constraint = constraint || new TypeConstraint(stringFromValueType(valueType))
                break;
        }
    }
    return constraint || undefined

}

/**
 * Simple test to see if a value adheres to a set of constraints
 */
export function validate(

    value:any, // The value to test for constraints. Must be one of the basic types supported by contraints
    constraintString:string // the constraints to test it against. Constraints listed must match the type being tested. Do not include < > brackets.

):string // returns '' if no violation, otherwise returns the error string of the ConstraintError encountered
{
    let type:string = typeof value
    if(type === 'object') {
        if(Array.isArray(value)) type = 'array'
    }
    let tc = parseConstraints(type, constraintString || '')
    let ok:string = ''
    try {
        if(tc) tc.test(value)
    } catch(e:any) {
        ok = e.message || e.toString()
    }
    return ok

}

