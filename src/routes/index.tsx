import {
	createMemo,
	createSignal,
	onCleanup,
	onMount,
	type Component,
} from 'solid-js';
import {Mutex} from 'async-mutex';
import {throttle} from 'lodash-es';

import styles from './index.module.css';

interface Size {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface ProbeProps {
	index: number;
	onResize?: (size: Size) => void;
}

const Probe = (props: ProbeProps) => {
	let element!: HTMLSpanElement;

	const [observer, setObserver] = createSignal<ResizeObserver | undefined>(
		undefined,
	);

	onMount(() => {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target instanceof HTMLElement) {
					requestAnimationFrame(() => {
						props.onResize?.({
							left: entry.target.offsetLeft,
							top: entry.target.offsetTop,
							width: entry.target.offsetWidth,
							height: entry.target.offsetHeight,
						});
					});
				}
			}
		});

		observer.observe(element);

		setObserver(observer);
	});

	onCleanup(() => {
		observer()?.disconnect();
	});

	return <span ref={element} />;
};

const Index: Component = () => {
	const [probeIndex, setProbeIndex] = createSignal(0);
	const [probeResizeCallback, setProbeResizeCallback] = createSignal<
		((size: Size) => void) | undefined
	>(undefined);

	const probeText =
		'に掲げる行為又は事由その他これらに類する行為又は事由により、同意しない意思を形成し、表明し若しくは全うすることが困難な状態にさせ又はその状態にあることに乗じて、性交、 ';

	let anchorElement1!: HTMLSpanElement;
	let anchorElement2!: HTMLSpanElement;
	let wrapperElement!: HTMLDivElement;

	const mutex = new Mutex();

	const adjustProbeIndex = async (anchorElement: HTMLSpanElement) => {
		let lower = 0;
		let upper = probeText.length;

		while (lower < upper) {
			const middle = Math.floor((lower + upper) / 2);

			const size = await new Promise<Size>((resolve) => {
				setProbeResizeCallback(() => (size: Size) => {
					resolve(size);
				});
				setProbeIndex(middle);
			});

			if (size.top <= anchorElement.offsetTop) {
				lower = middle + 1;
			} else {
				upper = middle;
			}
		}

		console.log(probeText.slice(0, lower - 1));
	};

	const onWindowResize = throttle(() => {
		mutex.runExclusive(() => adjustProbeIndex(anchorElement1));
	}, 300);

	onMount(() => {
		addEventListener('resize', onWindowResize);
		onWindowResize();
		return () => {
			removeEventListener('resize', onWindowResize);
		};
	});

	const probeTextElements = createMemo(() => {
		return [
			probeText.slice(0, probeIndex()),
			<Probe onResize={probeResizeCallback()} index={probeIndex()} />,
			probeText.slice(probeIndex()),
		].filter((element) => element !== '');
	});

	return (
		<div>
			<header>刑法第一百七十八条</header>
			<div class={styles.wrapper} ref={wrapperElement}>
				<span id="anchor1" ref={anchorElement1}>
					前条第一項各号
				</span>
				{probeTextElements()}
				<ruby>
					肛<rp>（</rp>
					<rt>こう</rt>
					<rp>）</rp>
				</ruby>
				門性交、口
				<ruby>
					腔<rp>（</rp>
					<rt>くう</rt>
					<rp>）</rp>
				</ruby>
				性交又は
				<ruby>
					膣<rp>（</rp>
					<rt>ちつ</rt>
					<rp>）</rp>
				</ruby>
				若しくは肛門に身体の一部（陰茎を除く。）若しくは
				<span id="anchor2" ref={anchorElement2}>
					物を挿入する行為であってわいせつなもの
				</span>
				（以下この条及び第百七十九条第二項において「性交等」という。）をした者は、婚姻関係の有無にかかわらず、五年以上の有期拘禁刑に処する。
			</div>
		</div>
	);
};

export default Index;
