
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.6' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ImageSet.svelte generated by Svelte v3.46.6 */

    const file$5 = "src/ImageSet.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let t0;
    	let div5;
    	let div4;
    	let div1;
    	let h5;
    	let t2;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let div3;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Do it";
    			t2 = space();
    			div2 = element("div");
    			img0 = element("img");
    			t3 = space();
    			div3 = element("div");
    			img1 = element("img");
    			attr_dev(div0, "class", "divider");
    			add_location(div0, file$5, 0, 0, 0);
    			add_location(h5, file$5, 3, 25, 91);
    			attr_dev(div1, "class", "col s12");
    			add_location(div1, file$5, 3, 4, 70);
    			if (!src_url_equal(img0.src, img0_src_value = "https://picsum.photos/200/200")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$5, 4, 24, 136);
    			attr_dev(div2, "class", "col s6");
    			add_location(div2, file$5, 4, 4, 116);
    			if (!src_url_equal(img1.src, img1_src_value = "https://picsum.photos/200/200")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$5, 5, 24, 217);
    			attr_dev(div3, "class", "col s6");
    			add_location(div3, file$5, 5, 4, 197);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$5, 2, 2, 48);
    			attr_dev(div5, "class", "section");
    			add_location(div5, file$5, 1, 0, 24);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h5);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, img0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, img1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ImageSet', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ImageSet> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ImageSet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSet",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/EntryForm.svelte generated by Svelte v3.46.6 */
    const file$4 = "src/EntryForm.svelte";

    function create_fragment$4(ctx) {
    	let div0;
    	let imageset;
    	let t0;
    	let div5;
    	let form;
    	let div2;
    	let div1;
    	let input;
    	let t1;
    	let div4;
    	let div3;
    	let textarea;
    	let t2;
    	let label;
    	let t4;
    	let button;
    	let t5;
    	let i;
    	let current;
    	imageset = new ImageSet({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(imageset.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			form = element("form");
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			label = element("label");
    			label.textContent = "Textarea";
    			t4 = space();
    			button = element("button");
    			t5 = text("Submit\n      ");
    			i = element("i");
    			i.textContent = "send";
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$4, 4, 0, 64);
    			attr_dev(input, "placeholder", "Title");
    			attr_dev(input, "id", "Title");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "validate");
    			add_location(input, file$4, 11, 8, 217);
    			attr_dev(div1, "class", "input-field col s12");
    			add_location(div1, file$4, 10, 6, 175);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$4, 9, 4, 151);
    			attr_dev(textarea, "id", "textarea1");
    			attr_dev(textarea, "class", "materialize-textarea");
    			add_location(textarea, file$4, 16, 8, 381);
    			attr_dev(label, "for", "textarea1");
    			add_location(label, file$4, 17, 8, 446);
    			attr_dev(div3, "class", "input-field col s12");
    			add_location(div3, file$4, 15, 6, 339);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$4, 14, 4, 315);
    			attr_dev(i, "class", "material-icons right");
    			add_location(i, file$4, 23, 6, 608);
    			attr_dev(button, "class", "btn waves-effect waves-light");
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "name", "action");
    			add_location(button, file$4, 21, 4, 515);
    			attr_dev(form, "class", "col s12");
    			add_location(form, file$4, 8, 2, 124);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$4, 7, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(imageset, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, form);
    			append_dev(form, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			append_dev(form, t1);
    			append_dev(form, div4);
    			append_dev(div4, div3);
    			append_dev(div3, textarea);
    			append_dev(div3, t2);
    			append_dev(div3, label);
    			append_dev(form, t4);
    			append_dev(form, button);
    			append_dev(button, t5);
    			append_dev(button, i);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageset.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageset.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(imageset);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EntryForm', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EntryForm> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ImageSet });
    	return [];
    }

    class EntryForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EntryForm",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/NavBar.svelte generated by Svelte v3.46.6 */
    const file$3 = "src/NavBar.svelte";

    // (28:8) {:else}
    function create_else_block_1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Close Rando";
    			attr_dev(a, "class", "session");
    			add_location(a, file$3, 29, 10, 906);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(28:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#if !isFormOpen}
    function create_if_block_1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Start a Rando";
    			attr_dev(a, "class", "session");
    			add_location(a, file$3, 26, 10, 759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(25:8) {#if !isFormOpen}",
    		ctx
    	});

    	return block;
    }

    // (41:4) {:else}
    function create_else_block(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Close Rando";
    			attr_dev(a, "class", "session");
    			add_location(a, file$3, 42, 6, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_3*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(41:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#if !isFormOpen}
    function create_if_block$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Start a Rando";
    			attr_dev(a, "class", "session");
    			add_location(a, file$3, 39, 6, 1138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_2*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(38:4) {#if !isFormOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let i;
    	let t3;
    	let ul0;
    	let li0;
    	let t4;
    	let ul1;
    	let li1;

    	function select_block_type(ctx, dirty) {
    		if (!/*isFormOpen*/ ctx[1]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*isFormOpen*/ ctx[1]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Rando App";
    			t1 = space();
    			a1 = element("a");
    			i = element("i");
    			i.textContent = "menu";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			if_block0.c();
    			t4 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			if_block1.c();
    			attr_dev(a0, "class", "brand-logo");
    			add_location(a0, file$3, 17, 4, 418);
    			attr_dev(i, "class", "material-icons");
    			add_location(i, file$3, 20, 7, 568);
    			attr_dev(a1, "data-target", "mobile-demo");
    			attr_dev(a1, "class", "sidenav-trigger");
    			add_location(a1, file$3, 19, 4, 508);
    			add_location(li0, file$3, 23, 6, 662);
    			attr_dev(ul0, "class", "right hide-on-med-and-down");
    			add_location(ul0, file$3, 22, 4, 616);
    			attr_dev(div, "class", "nav-wrapper");
    			add_location(div, file$3, 15, 2, 338);
    			add_location(nav, file$3, 14, 0, 330);
    			add_location(li1, file$3, 36, 2, 1053);
    			attr_dev(ul1, "class", "sidenav");
    			attr_dev(ul1, "id", "mobile-demo");
    			add_location(ul1, file$3, 35, 0, 1013);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(a1, i);
    			append_dev(div, t3);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			if_block0.m(li0, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li1);
    			if_block1.m(li1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(li0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(li1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_block0.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(ul1);
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	let { showForm } = $$props;
    	let { isFormOpen } = $$props;
    	let { hideForm } = $$props;

    	onMount(() => {
    		document.addEventListener("DOMContentLoaded", function () {
    			var elems = document.querySelectorAll(".sidenav");
    			M.Sidenav.init(elems, {});
    		});
    	});

    	const writable_props = ['showForm', 'isFormOpen', 'hideForm'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => showForm();
    	const click_handler_1 = () => hideForm();
    	const click_handler_2 = () => showForm();
    	const click_handler_3 = () => hideForm();

    	$$self.$$set = $$props => {
    		if ('showForm' in $$props) $$invalidate(0, showForm = $$props.showForm);
    		if ('isFormOpen' in $$props) $$invalidate(1, isFormOpen = $$props.isFormOpen);
    		if ('hideForm' in $$props) $$invalidate(2, hideForm = $$props.hideForm);
    	};

    	$$self.$capture_state = () => ({ onMount, showForm, isFormOpen, hideForm });

    	$$self.$inject_state = $$props => {
    		if ('showForm' in $$props) $$invalidate(0, showForm = $$props.showForm);
    		if ('isFormOpen' in $$props) $$invalidate(1, isFormOpen = $$props.isFormOpen);
    		if ('hideForm' in $$props) $$invalidate(2, hideForm = $$props.hideForm);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showForm,
    		isFormOpen,
    		hideForm,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { showForm: 0, isFormOpen: 1, hideForm: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*showForm*/ ctx[0] === undefined && !('showForm' in props)) {
    			console.warn("<NavBar> was created without expected prop 'showForm'");
    		}

    		if (/*isFormOpen*/ ctx[1] === undefined && !('isFormOpen' in props)) {
    			console.warn("<NavBar> was created without expected prop 'isFormOpen'");
    		}

    		if (/*hideForm*/ ctx[2] === undefined && !('hideForm' in props)) {
    			console.warn("<NavBar> was created without expected prop 'hideForm'");
    		}
    	}

    	get showForm() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showForm(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFormOpen() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFormOpen(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideForm() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideForm(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tile.svelte generated by Svelte v3.46.6 */

    const file$2 = "src/Tile.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let h2;
    	let t1;
    	let div4;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div3;
    	let div1;
    	let t5;
    	let div2;
    	let a;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Rando Card";
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t2 = space();
    			img1 = element("img");
    			t3 = space();
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Officiis\n        minus, quaerat eos accusantium dicta maxime sit sapiente nam impedit,\n        dolore facilis totam debitis ex corporis quas porro doloribus? Illum,\n        aut.";
    			t5 = space();
    			div2 = element("div");
    			a = element("a");
    			a.textContent = "This is a link";
    			attr_dev(h2, "class", "header");
    			add_location(h2, file$2, 1, 2, 27);
    			if (!src_url_equal(img0.src, img0_src_value = "https://picsum.photos/100/100")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$2, 4, 6, 129);
    			if (!src_url_equal(img1.src, img1_src_value = "https://picsum.photos/100/100")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 5, 6, 179);
    			attr_dev(div0, "class", "card-image");
    			add_location(div0, file$2, 3, 4, 98);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$2, 8, 6, 271);
    			attr_dev(a, "href", "#");
    			add_location(a, file$2, 16, 8, 649);
    			attr_dev(div2, "class", "card-action");
    			add_location(div2, file$2, 14, 6, 561);
    			attr_dev(div3, "class", "card-stacked");
    			add_location(div3, file$2, 7, 4, 238);
    			attr_dev(div4, "class", "card horizontal");
    			add_location(div4, file$2, 2, 2, 64);
    			attr_dev(div5, "class", "col s12 m7");
    			add_location(div5, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h2);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t2);
    			append_dev(div0, img1);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tile', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tile> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tile",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/TileFeed.svelte generated by Svelte v3.46.6 */
    const file$1 = "src/TileFeed.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let tile0;
    	let t0;
    	let tile1;
    	let t1;
    	let tile2;
    	let current;
    	tile0 = new Tile({ $$inline: true });
    	tile1 = new Tile({ $$inline: true });
    	tile2 = new Tile({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tile0.$$.fragment);
    			t0 = space();
    			create_component(tile1.$$.fragment);
    			t1 = space();
    			create_component(tile2.$$.fragment);
    			attr_dev(div, "class", "feed svelte-5f7wf1");
    			add_location(div, file$1, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tile0, div, null);
    			append_dev(div, t0);
    			mount_component(tile1, div, null);
    			append_dev(div, t1);
    			mount_component(tile2, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tile0.$$.fragment, local);
    			transition_in(tile1.$$.fragment, local);
    			transition_in(tile2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tile0.$$.fragment, local);
    			transition_out(tile1.$$.fragment, local);
    			transition_out(tile2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tile0);
    			destroy_component(tile1);
    			destroy_component(tile2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TileFeed', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TileFeed> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Tile });
    	return [];
    }

    class TileFeed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TileFeed",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.6 */
    const file = "src/App.svelte";

    // (21:1) {#if isFormOpen}
    function create_if_block(ctx) {
    	let entryform;
    	let current;
    	entryform = new EntryForm({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(entryform.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(entryform, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(entryform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(entryform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(entryform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:1) {#if isFormOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let navbar;
    	let t0;
    	let t1;
    	let tilefeed;
    	let current;

    	navbar = new NavBar({
    			props: {
    				showForm: /*showForm*/ ctx[1],
    				isFormOpen: /*isFormOpen*/ ctx[0],
    				hideForm: /*hideForm*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block = /*isFormOpen*/ ctx[0] && create_if_block(ctx);
    	tilefeed = new TileFeed({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(tilefeed.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 18, 0, 287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			mount_component(tilefeed, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};
    			if (dirty & /*isFormOpen*/ 1) navbar_changes.isFormOpen = /*isFormOpen*/ ctx[0];
    			navbar.$set(navbar_changes);

    			if (/*isFormOpen*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*isFormOpen*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(tilefeed.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(tilefeed.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navbar);
    			if (if_block) if_block.d();
    			destroy_component(tilefeed);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let isFormOpen = false;

    	//funcs
    	function showForm() {
    		$$invalidate(0, isFormOpen = true);
    	}

    	function hideForm() {
    		$$invalidate(0, isFormOpen = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		EntryForm,
    		NavBar,
    		TileFeed,
    		isFormOpen,
    		showForm,
    		hideForm
    	});

    	$$self.$inject_state = $$props => {
    		if ('isFormOpen' in $$props) $$invalidate(0, isFormOpen = $$props.isFormOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isFormOpen, showForm, hideForm];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
