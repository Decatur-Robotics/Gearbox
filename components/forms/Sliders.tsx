
export default function DefenseSlider(props={}) {

    return <div className="w-full text-center">
        <h1 className="font-semibold text-xl mt-8 mb-2">Defense</h1>
        <input type="range" min={1} max="3" value="2" className="range range-primary" step="1" />
        <div className="w-full flex justify-between text-lg px-2 text-center">
            <span>None</span>
            <span>Partial</span>
            <span>Full</span>
        </div>
    </div>
}