import React, { Children, memo } from 'react'

export type FlipProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: [React.ReactNode, React.ReactNode]
  height?: React.CSSProperties['height']
  isFlipped?: boolean
  perspective?: React.CSSProperties['perspective']
  width?: React.CSSProperties['width']
}

function Flip({ children, height, isFlipped, perspective, style, width, ...props }: FlipProps) {
  const [firstChild, lastChild] = Children.toArray(children)

  return (
    <div style={{ ...style, height, perspective, width }} {...props}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 1s',
          transformOrigin: 'center right',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'translateX(-100%) rotateY(-180deg)' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
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
            transform: 'rotateY(180deg)',
          }}
        >
          {lastChild}
        </div>
      </div>
    </div>
  )
}

export default memo(Flip)
