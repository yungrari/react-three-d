import React, { Children, memo } from 'react'

export type FlipProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: [React.ReactNode, React.ReactNode]
  height?: React.CSSProperties['height']
  isFlipped: boolean
  onFlipEnd?: React.TransitionEventHandler<HTMLDivElement>
  perspective?: React.CSSProperties['perspective']
  width?: React.CSSProperties['width']
}

function Flip({ children, height, isFlipped, onFlipEnd, perspective, style, width, ...props }: FlipProps) {
  const [firstChild, lastChild] = Children.toArray(children)

  function handleFlipEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (onFlipEnd) {
      onFlipEnd(event)
    }
  }

  return (
    <div style={{ ...style, height, perspective, width }} {...props}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 1s',
          WebkitTransition: 'transform 1s',
          transformOrigin: 'center right',
          WebkitTransformOrigin: 'center right',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: isFlipped ? 'translateX(-100%) rotateY(-180deg)' : 'none',
          WebkitTransform: isFlipped ? 'translateX(-100%) rotateY(-180deg)' : 'none',
        }}
        onTransitionEnd={handleFlipEnd}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            MozBackfaceVisibility: 'hidden',
          }}
        >
          {firstChild}
        </div>

        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            MozBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            WebkitTransform: 'rotateY(180deg)',
          }}
        >
          {lastChild}
        </div>
      </div>
    </div>
  )
}

export default memo(Flip)
